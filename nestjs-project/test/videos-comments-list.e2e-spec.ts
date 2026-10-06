import request from 'supertest';
import { DataSource } from 'typeorm';
import { Comment } from '../src/comments/entities/comment.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video } from '../src/videos/entities/video.entity';
import {
  bearer,
  createDraftVideo,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface CommentBody {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  viewerReaction: 'like' | 'dislike' | null;
}

interface ThreadBody extends CommentBody {
  replies: CommentBody[];
  repliesCount: number;
}

interface PageBody {
  items: ThreadBody[];
  total: number;
  offset: number;
  limit: number;
}

async function seedComment(
  dataSource: DataSource,
  videoId: string,
  userId: string,
  minutesAgo: number,
  parentId: string | null = null,
): Promise<Comment> {
  const repository = dataSource.getRepository(Comment);
  const saved = await repository.save(
    repository.create({
      video_id: videoId,
      user_id: userId,
      parent_id: parentId,
      body: `há ${minutesAgo} min`,
    }),
  );
  await dataSource.query(
    `UPDATE comments SET created_at = now() - ($1 || ' minutes')::interval WHERE id = $2`,
    [minutesAgo, saved.id],
  );
  return saved;
}

// Spec: nestjs-project/specs/videos-comments-list.plan.md (SI-06.8)
// Raízes mais recentes primeiro, até 3 respostas pré-carregadas e o
// repliesCount da thread (social-interactions/TD-05); viewerReaction só com
// Bearer válido (social-interactions-anonymous-gate/TD-02).
describe('videos-comments-list', () => {
  let ctx: SocialE2eContext;
  let viewer: AuthenticatedUser;
  let video: Video;
  let quietVideo: Video;
  let draft: Video;
  let newestRoot: Comment;
  let dislikedReply: Comment;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'list_owner');
    viewer = await registerConfirmAndLogin(ctx.app, 'list_viewer');
    video = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    quietVideo = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    draft = await createDraftVideo(ctx.dataSource, owner.channel.id);

    // 12 raízes: a mais recente (1 min) tem 7 respostas.
    for (let minutes = 12; minutes >= 2; minutes--) {
      await seedComment(ctx.dataSource, video.id, owner.userId, minutes * 10);
    }
    newestRoot = await seedComment(ctx.dataSource, video.id, owner.userId, 10);
    for (let i = 1; i <= 7; i++) {
      const reply = await seedComment(
        ctx.dataSource,
        video.id,
        owner.userId,
        10 - i,
        newestRoot.id,
      );
      if (i === 7) dislikedReply = reply;
    }
    await ctx.dataSource.query(
      `INSERT INTO comment_reactions (user_id, comment_id, type) VALUES ($1, $2, 'like'), ($1, $3, 'dislike')`,
      [viewer.userId, newestRoot.id, dislikedReply.id],
    );
    await seedComment(ctx.dataSource, draft.id, owner.userId, 5);
  }, 60000);

  const http = () => request(ctx.app.getHttpServer());
  const listUrl = (v: Video) => `/videos/${v.public_id}/comments`;

  // 1. Paginação e ordenação

  // Cenário 1.1 do spec — AC #1
  it('returns the first 10 roots newest first with preloaded replies', async () => {
    const res = await http().get(listUrl(video));
    const page = res.body as PageBody;

    expect(res.status).toBe(200);
    expect(page.items).toHaveLength(10);
    expect(page.total).toBe(12);
    expect(page.offset).toBe(0);
    expect(page.limit).toBe(10);

    const created = page.items.map((t) => Date.parse(t.createdAt));
    expect([...created].sort((a, b) => b - a)).toEqual(created);

    const first = page.items[0];
    expect(first.id).toBe(newestRoot.id);
    expect(first.replies).toHaveLength(3);
    expect(first.repliesCount).toBe(7);
    expect(first.replies.map((r) => r.body)).toEqual([
      'há 3 min',
      'há 4 min',
      'há 5 min',
    ]);
    for (const reply of first.replies) {
      expect(reply.parentId).toBe(newestRoot.id);
    }
    for (const thread of page.items) {
      expect(thread.parentId).toBeNull();
    }
  });

  // Cenário 1.2 do spec — AC #2
  it('pages forward without repeating roots', async () => {
    const first = (await http().get(listUrl(video))).body as PageBody;
    const second = (await http().get(`${listUrl(video)}?offset=10`))
      .body as PageBody;

    expect(second.items).toHaveLength(2);
    const firstIds = new Set(first.items.map((t) => t.id));
    expect(second.items.some((t) => firstIds.has(t.id))).toBe(false);
  });

  // Cenário 1.3 do spec — AC #3
  it('returns an empty page for a video without comments', async () => {
    const res = await http().get(listUrl(quietVideo));
    expect(res.status).toBe(200);
    expect((res.body as PageBody).items).toEqual([]);
    expect((res.body as PageBody).total).toBe(0);
  });

  // 2. Estado pessoal e validação

  // Cenário 2.1 do spec — AC #4
  it('fills viewerReaction only with a bearer token', async () => {
    const asViewer = (await http().get(listUrl(video)).set(bearer(viewer)))
      .body as PageBody;
    const root = asViewer.items[0];
    expect(root.viewerReaction).toBe('like');

    // A resposta marcada é a mais recente, logo pré-carregada.
    const marked = root.replies.find((r) => r.id === dislikedReply.id);
    expect(marked?.viewerReaction).toBe('dislike');
    expect(asViewer.items[1].viewerReaction).toBeNull();

    const anonymous = (await http().get(listUrl(video))).body as PageBody;
    for (const thread of anonymous.items) {
      expect(thread.viewerReaction).toBeNull();
      for (const reply of thread.replies) {
        expect(reply.viewerReaction).toBeNull();
      }
    }
  });

  // Cenário 2.2 do spec — AC #5
  it('rejects out-of-range limits and hides drafts of other channels', async () => {
    const zero = await http().get(`${listUrl(video)}?limit=0`);
    expect(zero.status).toBe(400);
    expect((zero.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const tooBig = await http().get(`${listUrl(video)}?limit=51`);
    expect(tooBig.status).toBe(400);
    expect((tooBig.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const onDraft = await http().get(listUrl(draft)).set(bearer(viewer));
    expect(onDraft.status).toBe(404);
    expect((onDraft.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');
  });
});

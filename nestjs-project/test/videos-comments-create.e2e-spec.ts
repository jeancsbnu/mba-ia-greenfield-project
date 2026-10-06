import request from 'supertest';
import { Comment } from '../src/comments/entities/comment.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video } from '../src/videos/entities/video.entity';
import {
  bearer,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  renameChannel,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface CommentBody {
  id: string;
  parentId: string | null;
  body: string;
  likesCount: number;
  viewerReaction: string | null;
  author: { name: string; nickname: string };
}

// Spec: nestjs-project/specs/videos-comments-create.plan.md (SI-06.9)
// Raiz e resposta pela mesma rota (OQ-12), profundidade 1
// (social-interactions/TD-04), comments_count na mesma transação (TD-02) e
// orçamento de 5/60 s por IP (TD-09).
describe('videos-comments-create', () => {
  let ctx: SocialE2eContext;
  let commenter: AuthenticatedUser;
  let videoA: Video;
  let rootA: Comment;
  let replyA: Comment;
  let rootB: Comment;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'create_owner');
    commenter = await registerConfirmAndLogin(ctx.app, 'create_commenter');
    await renameChannel(
      ctx.dataSource,
      commenter.channel,
      'maria_rocha',
      'Maria Rocha',
    );
    videoA = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    const videoB = await createPublishedVideo(ctx.dataSource, owner.channel.id);

    const comments = ctx.dataSource.getRepository(Comment);
    rootA = await comments.save(
      comments.create({
        video_id: videoA.id,
        user_id: owner.userId,
        body: 'Raiz A',
      }),
    );
    replyA = await comments.save(
      comments.create({
        video_id: videoA.id,
        user_id: owner.userId,
        parent_id: rootA.id,
        body: 'Resposta A',
      }),
    );
    rootB = await comments.save(
      comments.create({
        video_id: videoB.id,
        user_id: owner.userId,
        body: 'Raiz B',
      }),
    );
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());
  const commentsUrl = () => `/videos/${videoA.public_id}/comments`;

  async function commentsCount(): Promise<number> {
    const res = await http().get(`/videos/${videoA.public_id}/public`);
    return (res.body as { commentsCount: number }).commentsCount;
  }

  // 1. Publicação

  // Cenário 1.1 do spec — AC #1
  it('creates a root comment and bumps commentsCount', async () => {
    const before = await commentsCount();

    const res = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'Ótimo vídeo' });
    const body = res.body as CommentBody;

    expect(res.status).toBe(201);
    expect(body.body).toBe('Ótimo vídeo');
    expect(body.parentId).toBeNull();
    expect(body.likesCount).toBe(0);
    expect(body.viewerReaction).toBeNull();
    expect(body.author).toEqual({
      name: 'Maria Rocha',
      nickname: 'maria_rocha',
    });
    expect(await commentsCount()).toBe(before + 1);
  });

  // Cenário 1.2 do spec — AC #2
  it('attaches a reply to a reply as a sibling under the root', async () => {
    const res = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'Concordo', parentId: replyA.id });

    expect(res.status).toBe(201);
    expect((res.body as CommentBody).parentId).toBe(rootA.id);

    const page = (await http().get(commentsUrl())).body as {
      items: {
        id: string;
        repliesCount: number;
        replies: { body: string }[];
      }[];
    };
    const thread = page.items.find((t) => t.id === rootA.id);
    expect(thread?.repliesCount).toBe(2);
    expect(thread?.replies.map((r) => r.body)).toContain('Concordo');
  });

  // 2. Validação e erros

  // Cenário 2.1 do spec — AC #3
  it('rejects blank and oversized bodies and accepts exactly 2000 characters', async () => {
    const blank = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: '   ' });
    expect(blank.status).toBe(400);
    expect((blank.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const tooLong = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'a'.repeat(2001) });
    expect(tooLong.status).toBe(400);
    expect((tooLong.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const exact = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'a'.repeat(2000) });
    expect(exact.status).toBe(201);
  });

  // Cenário 2.2 do spec — AC #4
  it('rejects a parent from another video and anonymous calls', async () => {
    const before = await commentsCount();

    const foreign = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'Oi', parentId: rootB.id });
    expect(foreign.status).toBe(404);
    expect((foreign.body as { error: string }).error).toBe('COMMENT_NOT_FOUND');

    const anonymous = await http().post(commentsUrl()).send({ body: 'Oi' });
    expect(anonymous.status).toBe(401);

    expect(await commentsCount()).toBe(before);
  });

  // 3. Orçamento de rate limit

  // Cenário 3.1 do spec — AC #5
  it('limits to 5 comments per 60 s, independent of the reactions budget', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await http()
        .post(commentsUrl())
        .set(bearer(commenter))
        .send({ body: `comentário ${i}` });
      expect(res.status).toBe(201);
    }

    const blocked = await http()
      .post(commentsUrl())
      .set(bearer(commenter))
      .send({ body: 'sexto' });
    expect(blocked.status).toBe(429);
    expect((blocked.body as { error: string }).error).toBe(
      'RATE_LIMIT_EXCEEDED',
    );

    const reaction = await http()
      .put(`/videos/${videoA.public_id}/reaction`)
      .set(bearer(commenter))
      .send({ type: 'like' });
    expect(reaction.status).toBe(200);
  });
});

import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Comment } from '../src/comments/entities/comment.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  bearer,
  createDraftVideo,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface ReplyBody {
  id: string;
  parentId: string;
  createdAt: string;
}

interface RepliesBody {
  items: ReplyBody[];
  total: number;
}

// Spec: nestjs-project/specs/comments-replies.plan.md (SI-06.10)
// O "Ver mais N respostas": respostas além das 3 pré-carregadas, mesma
// ordenação (social-interactions/TD-05); profundidade 1 (TD-04); comentário de
// rascunho alheio vira COMMENT_NOT_FOUND.
describe('comments-replies', () => {
  let ctx: SocialE2eContext;
  let viewer: AuthenticatedUser;
  let root: Comment;
  let replies: Comment[];
  let draftRoot: Comment;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'replies_owner');
    viewer = await registerConfirmAndLogin(ctx.app, 'replies_viewer');
    const video = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    const draft = await createDraftVideo(ctx.dataSource, owner.channel.id);

    const comments = ctx.dataSource.getRepository(Comment);
    root = await comments.save(
      comments.create({
        video_id: video.id,
        user_id: owner.userId,
        body: 'Raiz',
      }),
    );
    replies = [];
    for (let i = 1; i <= 7; i++) {
      const reply = await comments.save(
        comments.create({
          video_id: video.id,
          user_id: owner.userId,
          parent_id: root.id,
          body: `Resposta ${i}`,
        }),
      );
      await ctx.dataSource.query(
        `UPDATE comments SET created_at = now() - ($1 || ' minutes')::interval WHERE id = $2`,
        [100 - i, reply.id],
      );
      replies.push(reply);
    }
    draftRoot = await comments.save(
      comments.create({
        video_id: draft.id,
        user_id: owner.userId,
        body: 'Rascunho',
      }),
    );
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());

  // 1. Respostas restantes

  // Cenário 1.1 do spec — AC #1
  it('returns the remaining replies after the preloaded ones', async () => {
    const res = await http().get(`/comments/${root.id}/replies?offset=3`);
    const body = res.body as RepliesBody;

    expect(res.status).toBe(200);
    expect(body.total).toBe(7);
    expect(body.items).toHaveLength(4);
    const created = body.items.map((r) => Date.parse(r.createdAt));
    expect([...created].sort((a, b) => b - a)).toEqual(created);

    // As 3 pré-carregadas são as mais recentes (Resposta 7, 6 e 5).
    const preloaded = new Set(replies.slice(4).map((r) => r.id));
    expect(body.items.some((r) => preloaded.has(r.id))).toBe(false);
    for (const reply of body.items) {
      expect(reply.parentId).toBe(root.id);
    }
  });

  // Cenário 1.2 do spec — AC #2
  it('returns an empty page for the replies of a reply', async () => {
    const res = await http().get(`/comments/${replies[0].id}/replies`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  // 2. Erros

  // Cenário 2.1 do spec — AC #3
  it('rejects a non-uuid id and reports an unknown one', async () => {
    const invalid = await http().get('/comments/nao-e-uuid/replies');
    expect(invalid.status).toBe(400);
    expect((invalid.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const unknown = await http().get(`/comments/${randomUUID()}/replies`);
    expect(unknown.status).toBe(404);
    expect((unknown.body as { error: string }).error).toBe('COMMENT_NOT_FOUND');
  });

  // Cenário 2.2 do spec — AC #4
  it('hides comments of a draft of another channel', async () => {
    const onDraft = await http()
      .get(`/comments/${draftRoot.id}/replies`)
      .set(bearer(viewer));
    expect(onDraft.status).toBe(404);
    expect((onDraft.body as { error: string }).error).toBe('COMMENT_NOT_FOUND');

    const unknown = await http()
      .get(`/comments/${randomUUID()}/replies`)
      .set(bearer(viewer));
    expect(onDraft.body).toEqual(unknown.body);
  });
});

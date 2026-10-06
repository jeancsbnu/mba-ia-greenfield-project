import request from 'supertest';
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

interface ReactionBody {
  viewerReaction: 'like' | 'dislike' | null;
  likesCount: number;
}

// Spec: nestjs-project/specs/videos-reaction.plan.md (SI-06.4)
// Uma reação por usuário por vídeo (social-interactions/TD-01), likes_count
// mantido na mesma transação pela tabela de delta (TD-02) e nenhuma contagem
// de dislikes exposta (TD-03).
describe('videos-reaction', () => {
  let ctx: SocialE2eContext;
  let viewer: AuthenticatedUser;
  let published: Video;
  let draft: Video;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'react_owner');
    viewer = await registerConfirmAndLogin(ctx.app, 'react_viewer');
    published = await createPublishedVideo(ctx.dataSource, owner.channel.id);
    draft = await createDraftVideo(ctx.dataSource, owner.channel.id);
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());
  const reactionUrl = (video: Video) => `/videos/${video.public_id}/reaction`;

  async function likesOnDb(video: Video): Promise<number> {
    return (
      await ctx.dataSource
        .getRepository(Video)
        .findOneByOrFail({ id: video.id })
    ).likes_count;
  }

  function expectNoDislikeCount(body: object): void {
    expect(Object.keys(body).some((key) => /dislike/i.test(key))).toBe(false);
  }

  // 1. Ciclo de reação

  // Cenário 1.1 do spec — AC #1
  it('like adds one', async () => {
    const res = await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({ type: 'like' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ viewerReaction: 'like', likesCount: 1 });
    expect(await likesOnDb(published)).toBe(1);
  });

  // Cenário 1.2 do spec — AC #2, #6
  it('switching to dislike gives the like back', async () => {
    await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({ type: 'like' });

    const res = await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({ type: 'dislike' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ viewerReaction: 'dislike', likesCount: 0 });
    expectNoDislikeCount(res.body as object);

    const rows = await ctx.dataSource.query<{ type: string }[]>(
      'SELECT type FROM video_reactions WHERE user_id = $1 AND video_id = $2',
      [viewer.userId, published.id],
    );
    expect(rows).toEqual([{ type: 'dislike' }]);
  });

  // Cenário 1.3 do spec — AC #3, #6
  it('removing is idempotent', async () => {
    await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({ type: 'like' });

    const removed = await http()
      .delete(reactionUrl(published))
      .set(bearer(viewer));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ viewerReaction: null, likesCount: 0 });

    const again = await http()
      .delete(reactionUrl(published))
      .set(bearer(viewer));
    expect(again.status).toBe(200);
    expect((again.body as ReactionBody).likesCount).toBe(0);
    expectNoDislikeCount(removed.body as object);
    expectNoDislikeCount(again.body as object);
  });

  // Cenário 1.4 do spec — AC #4
  it('rejects an invalid type and anonymous calls', async () => {
    const invalid = await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({ type: 'love' });
    expect(invalid.status).toBe(400);
    expect((invalid.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const empty = await http()
      .put(reactionUrl(published))
      .set(bearer(viewer))
      .send({});
    expect(empty.status).toBe(400);

    const anonymous = await http()
      .put(reactionUrl(published))
      .send({ type: 'like' });
    expect(anonymous.status).toBe(401);

    expect(await likesOnDb(published)).toBe(0);
  });

  // Cenário 1.5 do spec — AC #5
  it('does not reveal a draft of another channel', async () => {
    const onDraft = await http()
      .put(reactionUrl(draft))
      .set(bearer(viewer))
      .send({ type: 'like' });
    expect(onDraft.status).toBe(404);
    expect((onDraft.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');

    const missing = await http()
      .put('/videos/naoexiste/reaction')
      .set(bearer(viewer))
      .send({ type: 'like' });
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual(onDraft.body);

    const rows = await ctx.dataSource.query<unknown[]>(
      'SELECT 1 FROM video_reactions',
    );
    expect(rows).toHaveLength(0);
  });
});

import request from 'supertest';
import { Channel } from '../src/channels/entities/channel.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video } from '../src/videos/entities/video.entity';
import {
  bearer,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface PublicDetailBody {
  likesCount: number;
  commentsCount: number;
  viewerReaction: 'like' | 'dislike' | null;
  channel: {
    nickname: string;
    name: string;
    subscribersCount: number;
    viewerSubscribed: boolean;
  };
  [key: string]: unknown;
}

// Spec: nestjs-project/specs/videos-public-detail-social.plan.md (SI-06.5)
// O detalhe público passa a trazer os contadores sociais e o estado pessoal de
// quem pede no mesmo payload (social-interactions-anonymous-gate/TD-02), sem
// nenhuma contagem de dislikes (social-interactions/TD-03).
describe('videos-public-detail-social', () => {
  let ctx: SocialE2eContext;
  let owner: AuthenticatedUser;
  let viewer: AuthenticatedUser;
  let video: Video;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    owner = await registerConfirmAndLogin(ctx.app, 'detail_owner');
    viewer = await registerConfirmAndLogin(ctx.app, 'detail_viewer');
    video = await createPublishedVideo(ctx.dataSource, owner.channel.id, {
      likes_count: 5,
      comments_count: 3,
    });
    await ctx.dataSource
      .getRepository(Channel)
      .update({ id: owner.channel.id }, { subscribers_count: 2 });
    await ctx.dataSource.query(
      `INSERT INTO video_reactions (user_id, video_id, type) VALUES ($1, $2, 'like')`,
      [viewer.userId, video.id],
    );
    await ctx.dataSource.query(
      'INSERT INTO subscriptions (user_id, channel_id) VALUES ($1, $2)',
      [viewer.userId, owner.channel.id],
    );
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());
  const detailUrl = () => `/videos/${video.public_id}/public`;

  // Cenário 1.1 do spec — AC #1, #4
  it('gives the anonymous visitor a neutral personal state', async () => {
    const res = await http().get(detailUrl());
    const body = res.body as PublicDetailBody;

    expect(res.status).toBe(200);
    expect(body.likesCount).toBe(5);
    expect(body.commentsCount).toBe(3);
    expect(body.viewerReaction).toBeNull();
    expect(body.channel.subscribersCount).toBe(2);
    expect(body.channel.viewerSubscribed).toBe(false);
    expect(Object.keys(body).some((key) => /dislike/i.test(key))).toBe(false);
  });

  // Cenário 1.2 do spec — AC #2
  it('gives each viewer their own state', async () => {
    const asViewer = (await http().get(detailUrl()).set(bearer(viewer)))
      .body as PublicDetailBody;
    expect(asViewer.viewerReaction).toBe('like');
    expect(asViewer.channel.viewerSubscribed).toBe(true);

    const asOwner = (await http().get(detailUrl()).set(bearer(owner)))
      .body as PublicDetailBody;
    expect(asOwner.viewerReaction).toBeNull();
    expect(asOwner.channel.viewerSubscribed).toBe(false);
  });

  // Cenário 1.3 do spec — AC #3
  it('stays anonymous with an invalid token instead of answering 401', async () => {
    const res = await http()
      .get(detailUrl())
      .set({ Authorization: 'Bearer token-invalido' });
    const body = res.body as PublicDetailBody;

    expect(res.status).toBe(200);
    expect(body.viewerReaction).toBeNull();
    expect(body.channel.viewerSubscribed).toBe(false);
  });

  // Cenário 1.4 do spec — AC #5
  it('keeps the Phase 05 contract', async () => {
    const body = (await http().get(detailUrl())).body as PublicDetailBody;

    for (const key of [
      'publicId',
      'title',
      'viewsCount',
      'streamUrl',
      'downloadUrl',
      'thumbnailUrl',
    ]) {
      expect(body).toHaveProperty(key);
    }
    expect(body.channel.nickname).toBe(owner.channel.nickname);
    expect(body.channel.name).toBe(owner.channel.name);
    for (const key of ['upload_id', 'processing_error', 'storage_key']) {
      expect(body).not.toHaveProperty(key);
    }
  });
});

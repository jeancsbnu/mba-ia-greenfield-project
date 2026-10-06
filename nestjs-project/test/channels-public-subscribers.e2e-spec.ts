import request from 'supertest';
import { Channel } from '../src/channels/entities/channel.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  bearer,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  renameChannel,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface PublicChannelBody {
  name: string;
  nickname: string;
  description: string | null;
  videosCount: number;
  subscribersCount: number;
  viewerSubscribed: boolean;
}

// Spec: nestjs-project/specs/channels-public-subscribers.plan.md (SI-06.6)
// A leitura pública do canal ganha a contagem de inscritos
// (social-interactions/TD-06) e o estado pessoal com Bearer opcional
// (social-interactions-anonymous-gate/TD-02).
describe('channels-public-subscribers', () => {
  let ctx: SocialE2eContext;
  let follower: AuthenticatedUser;
  let stranger: AuthenticatedUser;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'pub_owner');
    const channel = await renameChannel(
      ctx.dataSource,
      owner.channel,
      'joana_cria',
      'Joana Cria',
    );
    await createPublishedVideo(ctx.dataSource, channel.id);
    await createPublishedVideo(ctx.dataSource, channel.id);

    follower = await registerConfirmAndLogin(ctx.app, 'pub_follower');
    stranger = await registerConfirmAndLogin(ctx.app, 'pub_stranger');
    await ctx.dataSource.query(
      'INSERT INTO subscriptions (user_id, channel_id) VALUES ($1, $2)',
      [follower.userId, channel.id],
    );
    await ctx.dataSource
      .getRepository(Channel)
      .update({ id: channel.id }, { subscribers_count: 1 });
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());

  // Cenário 1.1 do spec — AC #1, #4
  it('shows the subscriber count to an anonymous visitor', async () => {
    const res = await http().get('/channels/joana_cria');
    const body = res.body as PublicChannelBody;

    expect(res.status).toBe(200);
    expect(body.subscribersCount).toBe(1);
    expect(body.viewerSubscribed).toBe(false);
    expect(body.name).toBe('Joana Cria');
    expect(body.nickname).toBe('joana_cria');
    expect(body).toHaveProperty('description');
    expect(body.videosCount).toBe(2);
  });

  // Cenário 1.2 do spec — AC #2
  it('fills viewerSubscribed per visitor', async () => {
    const asFollower = (
      await http().get('/channels/joana_cria').set(bearer(follower))
    ).body as PublicChannelBody;
    const asStranger = (
      await http().get('/channels/joana_cria').set(bearer(stranger))
    ).body as PublicChannelBody;

    expect(asFollower.viewerSubscribed).toBe(true);
    expect(asStranger.viewerSubscribed).toBe(false);
    expect(asFollower.subscribersCount).toBe(1);
    expect(asStranger.subscribersCount).toBe(1);
  });

  // Cenário 1.3 do spec — AC #3
  it('reflects a new subscription', async () => {
    const subscribed = await http()
      .put('/channels/joana_cria/subscription')
      .set(bearer(stranger));
    expect(subscribed.status).toBe(200);

    const body = (
      await http().get('/channels/joana_cria').set(bearer(stranger))
    ).body as PublicChannelBody;
    expect(body.subscribersCount).toBe(2);
    expect(body.viewerSubscribed).toBe(true);
  });
});

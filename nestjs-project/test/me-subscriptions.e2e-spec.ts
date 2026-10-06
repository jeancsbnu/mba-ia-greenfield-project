import request from 'supertest';
import { Channel } from '../src/channels/entities/channel.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { VideoVisibility } from '../src/videos/entities/video.entity';
import {
  bearer,
  createDraftVideo,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  renameChannel,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface SubscribedChannelBody {
  name: string;
  nickname: string;
  subscribersCount: number;
  videosCount: number;
}

interface PageBody {
  items: SubscribedChannelBody[];
  total: number;
}

// Spec: nestjs-project/specs/me-subscriptions.plan.md (SI-06.12)
// A área de canais seguidos é uma lista de canais, não um feed
// (social-interactions/TD-07); videosCount só conta publicados e públicos.
describe('me-subscriptions', () => {
  let ctx: SocialE2eContext;
  let follower: AuthenticatedUser;
  let lonely: AuthenticatedUser;
  let third: AuthenticatedUser;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const maria = await registerConfirmAndLogin(ctx.app, 'me_maria');
    const diego = await registerConfirmAndLogin(ctx.app, 'me_diego');
    const ana = await registerConfirmAndLogin(ctx.app, 'me_ana');
    const mariaChannel = await renameChannel(
      ctx.dataSource,
      maria.channel,
      'maria_rocha',
      'Maria Rocha',
    );
    const diegoChannel = await renameChannel(
      ctx.dataSource,
      diego.channel,
      'diego_farias',
      'Diego Farias',
    );
    const anaChannel = await renameChannel(
      ctx.dataSource,
      ana.channel,
      'ana_costa',
      'Ana Costa',
    );
    await createPublishedVideo(ctx.dataSource, mariaChannel.id);
    await createPublishedVideo(ctx.dataSource, mariaChannel.id);
    await createPublishedVideo(ctx.dataSource, mariaChannel.id, {
      visibility: VideoVisibility.UNLISTED,
    });
    await createDraftVideo(ctx.dataSource, mariaChannel.id);
    await createPublishedVideo(ctx.dataSource, anaChannel.id);

    follower = await registerConfirmAndLogin(ctx.app, 'me_follower');
    lonely = await registerConfirmAndLogin(ctx.app, 'me_lonely');
    third = await registerConfirmAndLogin(ctx.app, 'me_third');

    const subscribe = async (
      userId: string,
      channelId: string,
      minutesAgo: number,
    ): Promise<void> => {
      await ctx.dataSource.query(
        `INSERT INTO subscriptions (user_id, channel_id, created_at)
         VALUES ($1, $2, now() - ($3 || ' minutes')::interval)`,
        [userId, channelId, minutesAgo],
      );
    };
    await subscribe(follower.userId, mariaChannel.id, 30);
    await subscribe(follower.userId, diegoChannel.id, 20);
    await subscribe(follower.userId, anaChannel.id, 10);
    await subscribe(third.userId, diegoChannel.id, 5);
    await ctx.dataSource
      .getRepository(Channel)
      .update({ id: diegoChannel.id }, { subscribers_count: 2 });
    await ctx.dataSource
      .getRepository(Channel)
      .update({ id: mariaChannel.id }, { subscribers_count: 1 });
    await ctx.dataSource
      .getRepository(Channel)
      .update({ id: anaChannel.id }, { subscribers_count: 1 });
  }, 60000);

  const http = () => request(ctx.app.getHttpServer());

  // Cenário 1.1 do spec — AC #1, #2
  it('lists the three followed channels, most recent first', async () => {
    const res = await http().get('/me/subscriptions').set(bearer(follower));
    const body = res.body as PageBody;

    expect(res.status).toBe(200);
    expect(body.total).toBe(3);
    expect(body.items.map((c) => c.nickname)).toEqual([
      'ana_costa',
      'diego_farias',
      'maria_rocha',
    ]);
    const byNickname = new Map(body.items.map((c) => [c.nickname, c]));
    expect(byNickname.get('maria_rocha')?.videosCount).toBe(2);
    expect(byNickname.get('diego_farias')?.videosCount).toBe(0);
    expect(byNickname.get('ana_costa')?.videosCount).toBe(1);
    expect(byNickname.get('diego_farias')?.subscribersCount).toBe(2);
    for (const channel of body.items) {
      expect(Object.keys(channel).sort()).toEqual(
        ['name', 'nickname', 'subscribersCount', 'videosCount'].sort(),
      );
    }
  });

  // Cenário 1.2 do spec — AC #3
  it('returns an empty page for a user who follows nobody', async () => {
    const res = await http().get('/me/subscriptions').set(bearer(lonely));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ items: [], total: 0 });
  });

  // Cenário 1.3 do spec — AC #4
  it('never shows channels of another user and requires a token', async () => {
    const asThird = (await http().get('/me/subscriptions').set(bearer(third)))
      .body as PageBody;
    expect(asThird.items.map((c) => c.nickname)).toEqual(['diego_farias']);
    expect(asThird.total).toBe(1);

    expect((await http().get('/me/subscriptions')).status).toBe(401);
  });

  // Cenário 1.4 do spec — AC #5
  it('rejects a limit above the maximum', async () => {
    const tooBig = await http()
      .get('/me/subscriptions?limit=101')
      .set(bearer(follower));
    expect(tooBig.status).toBe(400);
    expect((tooBig.body as { error: string }).error).toBe('VALIDATION_ERROR');

    const max = await http()
      .get('/me/subscriptions?limit=100')
      .set(bearer(follower));
    expect(max.status).toBe(200);
  });
});

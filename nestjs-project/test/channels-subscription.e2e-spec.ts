import request from 'supertest';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  bearer,
  createSocialApp,
  registerConfirmAndLogin,
  renameChannel,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

interface SubscriptionBody {
  subscribed: boolean;
  subscribersCount: number;
}

// Spec: nestjs-project/specs/channels-subscription.plan.md (SI-06.3)
// Seguir e deixar de seguir um canal, com channels.subscribers_count mantido
// na mesma transação (social-interactions/TD-06) e as duas rotas idempotentes.
// Orçamento próprio de 60/60 s por IP (social-interactions/TD-09).
describe('channels-subscription', () => {
  let ctx: SocialE2eContext;
  let follower: AuthenticatedUser;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();

    const owner = await registerConfirmAndLogin(ctx.app, 'sub_owner');
    await renameChannel(ctx.dataSource, owner.channel, 'joana_cria');
    follower = await registerConfirmAndLogin(ctx.app, 'sub_follower');
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());

  async function subscribersOnDb(): Promise<number> {
    const rows = await ctx.dataSource.query<{ subscribers_count: number }[]>(
      `SELECT subscribers_count FROM channels WHERE nickname = 'joana_cria'`,
    );
    return Number(rows[0].subscribers_count);
  }

  // 1. Inscrever e cancelar

  // Cenário 1.1 do spec — AC #1
  it('subscribing adds one to the counter', async () => {
    expect(await subscribersOnDb()).toBe(0);

    const res = await http()
      .put('/channels/joana_cria/subscription')
      .set(bearer(follower));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ subscribed: true, subscribersCount: 1 });

    const rows = await ctx.dataSource.query<unknown[]>(
      `SELECT 1 FROM subscriptions s JOIN channels c ON c.id = s.channel_id
       WHERE c.nickname = 'joana_cria' AND s.user_id = $1`,
      [follower.userId],
    );
    expect(rows).toHaveLength(1);
  });

  // Cenário 1.2 do spec — AC #2
  it('repeating the subscription does not add again', async () => {
    await http().put('/channels/joana_cria/subscription').set(bearer(follower));

    const again = await http()
      .put('/channels/joana_cria/subscription')
      .set(bearer(follower));
    expect(again.status).toBe(200);
    expect(again.body).toEqual({ subscribed: true, subscribersCount: 1 });
    expect(await subscribersOnDb()).toBe(1);
  });

  // Cenário 1.3 do spec — AC #3
  it('unsubscribing subtracts one and is idempotent', async () => {
    await http().put('/channels/joana_cria/subscription').set(bearer(follower));

    const res = await http()
      .delete('/channels/joana_cria/subscription')
      .set(bearer(follower));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ subscribed: false, subscribersCount: 0 });

    const again = await http()
      .delete('/channels/joana_cria/subscription')
      .set(bearer(follower));
    expect(again.status).toBe(200);
    expect((again.body as SubscriptionBody).subscribersCount).toBe(0);
  });

  // Cenário 1.4 do spec — AC #4
  it('rejects anonymous calls and unknown channels without side effects', async () => {
    expect((await http().put('/channels/joana_cria/subscription')).status).toBe(
      401,
    );
    expect(
      (await http().delete('/channels/joana_cria/subscription')).status,
    ).toBe(401);

    const missing = await http()
      .put('/channels/nao_existe/subscription')
      .set(bearer(follower));
    expect(missing.status).toBe(404);
    expect((missing.body as { error: string }).error).toBe('CHANNEL_NOT_FOUND');

    const rows = await ctx.dataSource.query<unknown[]>(
      'SELECT 1 FROM subscriptions',
    );
    expect(rows).toHaveLength(0);
  });

  // 2. Orçamento de rate limit próprio

  // Cenário 2.1 do spec — AC #5
  it('limits to 60 calls per 60 s and keeps the auth budget independent', async () => {
    // O contador do throttler é por handler: 60 PUTs esgotam o orçamento do
    // PUT sem tocar no do DELETE.
    for (let i = 0; i < 60; i++) {
      const res = await http()
        .put('/channels/joana_cria/subscription')
        .set(bearer(follower));
      expect(res.status).toBe(200);
    }

    const blocked = await http()
      .put('/channels/joana_cria/subscription')
      .set(bearer(follower));
    expect(blocked.status).toBe(429);
    expect((blocked.body as { error: string }).error).toBe(
      'RATE_LIMIT_EXCEEDED',
    );

    ctx.throttlerStorage.storage.clear();
    let lastLogin = 0;
    for (let i = 0; i < 11; i++) {
      const res = await http()
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-password' });
      lastLogin = res.status;
    }
    expect(lastLogin).toBe(429);
  });
});

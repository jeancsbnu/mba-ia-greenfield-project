import { ConfigType } from '@nestjs/config';
import request from 'supertest';
import {
  CLIENT_IP_HEADER,
  INTERNAL_TOKEN_HEADER,
} from '../src/auth/auth.constants';
import internalApiConfig from '../src/config/internal-api.config';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  bearer,
  createPublishedVideo,
  createSocialApp,
  registerConfirmAndLogin,
  SocialE2eContext,
} from './social-e2e.helpers';

// Identidade do visitante no rate limit e orçamentos por rota
// (rate-limit-visitor-identity/TD-02, TD-03, TD-04). Toda requisição do
// supertest sai do mesmo socket — o mesmo cenário do BFF, que chega ao Nest
// com um IP só para todos os visitantes.

const UNKNOWN_VIDEO = 'zzzzzzzzzz';
const WRONG_LOGIN = { email: 'nobody@example.com', password: 'wrongpassword' };

describe('Throttling by visitor identity (e2e)', () => {
  let ctx: SocialE2eContext;
  let secret: string;

  const server = () => ctx.app.getHttpServer();
  const trustedAs = (ip: string) => ({
    [CLIENT_IP_HEADER]: ip,
    [INTERNAL_TOKEN_HEADER]: secret,
  });

  beforeAll(async () => {
    ctx = await createSocialApp();
    secret = ctx.app.get<ConfigType<typeof internalApiConfig>>(
      internalApiConfig.KEY,
    ).secret;
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();
  });

  describe('route budgets', () => {
    it('allows 120 requests per window on a route without its own budget', async () => {
      for (let i = 0; i < 120; i++) {
        const res = await request(server()).get(
          `/videos/${UNKNOWN_VIDEO}/public`,
        );
        expect(res.status).toBe(404);
      }

      const blocked = await request(server()).get(
        `/videos/${UNKNOWN_VIDEO}/public`,
      );
      expect(blocked.status).toBe(429);
      expect((blocked.body as { error: string }).error).toBe(
        'RATE_LIMIT_EXCEEDED',
      );
    }, 60000);

    it('keeps login at 10 requests per window', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(server())
          .post('/auth/login')
          .send(WRONG_LOGIN);
        expect(res.status).toBe(401);
      }

      const blocked = await request(server())
        .post('/auth/login')
        .send(WRONG_LOGIN);
      expect(blocked.status).toBe(429);
    });

    it.each([
      ['register', () => request(server()).post('/auth/register').send({})],
      [
        'confirm-email',
        () =>
          request(server()).get('/auth/confirm-email').query({ token: 'x' }),
      ],
      [
        'resend-confirmation',
        () => request(server()).post('/auth/resend-confirmation').send({}),
      ],
      [
        'forgot-password',
        () => request(server()).post('/auth/forgot-password').send({}),
      ],
      [
        'reset-password',
        () => request(server()).post('/auth/reset-password').send({}),
      ],
    ])('keeps %s at 10 requests per window', async (_route, send) => {
      for (let i = 0; i < 10; i++) {
        expect((await send()).status).not.toBe(429);
      }
      expect((await send()).status).toBe(429);
    });

    it('leaves refresh on the default budget', async () => {
      for (let i = 0; i < 11; i++) {
        const res = await request(server())
          .post('/auth/refresh')
          .send({ refresh_token: 'not-a-real-token' });
        expect(res.status).not.toBe(429);
      }
    });

    it('keeps the view budget at 30 requests per window', async () => {
      for (let i = 0; i < 30; i++) {
        const res = await request(server()).post(
          `/videos/${UNKNOWN_VIDEO}/view`,
        );
        expect(res.status).not.toBe(429);
      }

      const blocked = await request(server()).post(
        `/videos/${UNKNOWN_VIDEO}/view`,
      );
      expect(blocked.status).toBe(429);
    });
  });

  describe('visitor identity', () => {
    it('gives each trusted X-Client-IP its own bucket', async () => {
      for (let i = 0; i < 10; i++) {
        await request(server())
          .post('/auth/login')
          .set(trustedAs('203.0.113.1'))
          .send(WRONG_LOGIN)
          .expect(401);
      }

      await request(server())
        .post('/auth/login')
        .set(trustedAs('203.0.113.1'))
        .send(WRONG_LOGIN)
        .expect(429);

      await request(server())
        .post('/auth/login')
        .set(trustedAs('203.0.113.2'))
        .send(WRONG_LOGIN)
        .expect(401);
    });

    it.each([
      [
        'a wrong token',
        (ip: string) => ({
          [CLIENT_IP_HEADER]: ip,
          [INTERNAL_TOKEN_HEADER]: 'forged',
        }),
      ],
      ['no token', (ip: string) => ({ [CLIENT_IP_HEADER]: ip })],
    ])(
      'ignores a forged X-Client-IP sent with %s',
      async (_label, forgedAs) => {
        for (let i = 0; i < 10; i++) {
          await request(server())
            .post('/auth/login')
            .set(forgedAs(`198.51.100.${i}`))
            .send(WRONG_LOGIN)
            .expect(401);
        }

        await request(server())
          .post('/auth/login')
          .set(forgedAs('198.51.100.99'))
          .send(WRONG_LOGIN)
          .expect(429);
      },
    );

    it('counts an authenticated owner write per user, whatever X-Client-IP says', async () => {
      const owner = await registerConfirmAndLogin(ctx.app, 'throttle_owner');

      for (let i = 0; i < 120; i++) {
        const res = await request(server())
          .patch(`/videos/${UNKNOWN_VIDEO}`)
          .set({ ...bearer(owner), ...trustedAs(`192.0.2.${i}`) })
          .send({ title: 'Novo título' });
        expect(res.status).toBe(404);
      }

      const blocked = await request(server())
        .patch(`/videos/${UNKNOWN_VIDEO}`)
        .set({ ...bearer(owner), ...trustedAs('192.0.2.250') })
        .send({ title: 'Novo título' });
      expect(blocked.status).toBe(429);
    }, 60000);

    it('serves the request normally when the internal token is wrong', async () => {
      const owner = await registerConfirmAndLogin(ctx.app, 'throttle_viewer');
      const video = await createPublishedVideo(
        ctx.dataSource,
        owner.channel.id,
      );

      await request(server())
        .get(`/videos/${video.public_id}/public`)
        .set({
          [CLIENT_IP_HEADER]: '203.0.113.9',
          [INTERNAL_TOKEN_HEADER]: 'forged',
        })
        .expect(200);
    });
  });
});

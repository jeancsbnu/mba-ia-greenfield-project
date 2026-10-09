import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { VisitorThrottlerGuard } from './visitor-throttler.guard';

const SECRET = 'internal-test-secret';

// Expõe o `getTracker` protegido sem relaxar a visibilidade no guard.
class InspectableGuard extends VisitorThrottlerGuard {
  track(req: Record<string, unknown>): Promise<string> {
    return this.getTracker(req);
  }
}

describe('VisitorThrottlerGuard — getTracker', () => {
  let guard: InspectableGuard;
  let storage: ThrottlerStorageService;

  beforeAll(() => {
    storage = new ThrottlerStorageService();
    guard = new InspectableGuard(
      [{ ttl: 60000, limit: 10 }],
      storage,
      new Reflector(),
      { secret: SECRET },
    );
  });

  afterAll(() => storage.onApplicationShutdown());

  it('keys an authenticated request by user, ignoring the IP headers', async () => {
    const tracker = await guard.track({
      ip: '172.19.0.1',
      user: { sub: 'user-1', email: 'a@b.dev' },
      headers: { 'x-client-ip': '203.0.113.7', 'x-internal-token': SECRET },
    });

    expect(tracker).toBe('user:user-1');
  });

  it('trusts X-Client-IP when the internal token matches the secret', async () => {
    const tracker = await guard.track({
      ip: '172.19.0.1',
      headers: { 'x-client-ip': ' 203.0.113.7 ', 'x-internal-token': SECRET },
    });

    expect(tracker).toBe('ip:203.0.113.7');
  });

  it.each([
    ['a wrong token', { 'x-internal-token': 'forged-secret' }],
    ['a token of a different length', { 'x-internal-token': 'x' }],
    ['no token', {}],
    ['a repeated token header', { 'x-internal-token': [SECRET, SECRET] }],
  ])(
    'falls back to the socket IP for a forged X-Client-IP with %s',
    async (_label, tokenHeaders) => {
      const tracker = await guard.track({
        ip: '172.19.0.1',
        headers: { 'x-client-ip': '203.0.113.7', ...tokenHeaders },
      });

      expect(tracker).toBe('ip:172.19.0.1');
    },
  );

  it('uses the socket IP when no identity header is sent', async () => {
    const tracker = await guard.track({ ip: '172.19.0.1', headers: {} });

    expect(tracker).toBe('ip:172.19.0.1');
  });
});

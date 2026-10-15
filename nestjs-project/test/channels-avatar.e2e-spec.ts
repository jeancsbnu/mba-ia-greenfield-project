import request from 'supertest';
import { Channel } from '../src/channels/entities/channel.entity';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  bearer,
  createSocialApp,
  registerConfirmAndLogin,
  type AuthenticatedUser,
  type SocialE2eContext,
} from './social-e2e.helpers';

// PNG 1x1 válido: o validador de tipo do Nest lê os bytes, não só o mimetype.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Foto de perfil do canal: PUT/DELETE /me/channel/avatar (dono) e
// GET /channels/:nickname/avatar (público, 302 para a URL assinada ou 404).
describe('channels-avatar', () => {
  let ctx: SocialE2eContext;
  let owner: AuthenticatedUser;

  beforeAll(async () => {
    ctx = await createSocialApp();
  }, 30000);

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(ctx.dataSource);
    ctx.throttlerStorage.storage.clear();
    owner = await registerConfirmAndLogin(ctx.app, 'avatar_owner');
  }, 30000);

  const http = () => request(ctx.app.getHttpServer());
  const avatarPath = () => `/channels/${owner.channel.nickname}/avatar`;

  async function upload(bytes = PNG_BYTES, contentType = 'image/png') {
    return http()
      .put('/me/channel/avatar')
      .set(bearer(owner))
      .attach('avatar', bytes, { filename: 'avatar.png', contentType });
  }

  async function avatarKey(): Promise<string | null> {
    const channel = await ctx.dataSource
      .getRepository(Channel)
      .findOneByOrFail({ id: owner.channel.id });
    return channel.avatar_key;
  }

  it('answers 404 AVATAR_NOT_FOUND before any upload', async () => {
    const res = await http().get(avatarPath());

    expect(res.status).toBe(404);
    expect((res.body as { error: string }).error).toBe('AVATAR_NOT_FOUND');
  });

  it('stores the image and redirects the public read to it', async () => {
    expect((await upload()).status).toBe(204);

    const res = await http().get(avatarPath());
    expect(res.status).toBe(302);
    expect(res.headers['cache-control']).toBe('no-store');

    const image = await fetch(res.headers.location);
    expect(image.status).toBe(200);
    expect(image.headers.get('content-type')).toBe('image/png');
  });

  it('replaces the image under a new key', async () => {
    await upload();
    const first = await avatarKey();

    await upload();
    const second = await avatarKey();

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
  });

  it('removes the image, back to 404, and is idempotent', async () => {
    await upload();

    const removed = await http()
      .delete('/me/channel/avatar')
      .set(bearer(owner));
    expect(removed.status).toBe(204);
    expect(await avatarKey()).toBeNull();
    expect((await http().get(avatarPath())).status).toBe(404);

    const again = await http().delete('/me/channel/avatar').set(bearer(owner));
    expect(again.status).toBe(204);
  });

  it('rejects a non-image file with 400', async () => {
    const res = await upload(Buffer.from('not an image'), 'text/plain');

    expect(res.status).toBe(400);
    expect(await avatarKey()).toBeNull();
  });

  it('rejects a file over 2 MB', async () => {
    const res = await upload(
      Buffer.concat([PNG_BYTES, Buffer.alloc(2 * 1024 * 1024)]),
    );

    expect([400, 413]).toContain(res.status);
    expect(await avatarKey()).toBeNull();
  });

  it('requires a session to change the avatar', async () => {
    const res = await http()
      .put('/me/channel/avatar')
      .attach('avatar', PNG_BYTES, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(401);
  });

  // Uma página com N avatares faz N leituras: o limite global de 120/60 s por
  // visitante não pode valer aqui.
  it('is not rate limited', async () => {
    for (let i = 0; i < 130; i++) {
      const res = await http().get(avatarPath());
      expect(res.status).toBe(404);
    }
  });

  it('answers 404 CHANNEL_NOT_FOUND for an unknown channel', async () => {
    const res = await http().get('/channels/nao_existe/avatar');

    expect(res.status).toBe(404);
    expect((res.body as { error: string }).error).toBe('CHANNEL_NOT_FOUND');
  });
});

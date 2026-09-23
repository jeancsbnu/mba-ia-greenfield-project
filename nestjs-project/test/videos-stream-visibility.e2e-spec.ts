import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ChannelsService } from '../src/channels/channels.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import storageConfig from '../src/config/storage.config';
import { cleanAllTables } from '../src/test/create-test-data-source';
import {
  Video,
  VideoStatus,
  VideoVisibility,
} from '../src/videos/entities/video.entity';

interface MailServiceLike {
  sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}

interface AuthenticatedUser {
  userId: string;
  channelId: string;
  accessToken: string;
}

// Spec: nestjs-project/specs/videos-stream-visibility.plan.md (SI-04.7)
// Estado de publicação governa a assinatura: rascunho só para o dono, vídeo
// publicado (público ou indisponível) para quem tiver o link (TD-02).
describe('GET /videos/:publicId/stream e /download — rascunho e visibilidade (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelsService: ChannelsService;
  let throttlerStorage: ThrottlerStorageService;
  let bucket: string;

  let owner: AuthenticatedUser;
  let stranger: AuthenticatedUser;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new DomainExceptionFilter(),
      new ValidationExceptionFilter(),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    videoRepository = dataSource.getRepository(Video);
    channelsService = app.get(ChannelsService);
    throttlerStorage =
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage);
    bucket = app.get<ConfigType<typeof storageConfig>>(
      storageConfig.KEY,
    ).minioBucket;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  let emailCounter = 0;
  async function registerConfirmAndLogin(): Promise<AuthenticatedUser> {
    const email = `stream_vis_${++emailCounter}@example.com`;
    const password = 'password123';

    const authService = app.get(AuthService);
    const mailServiceInstance = (
      authService as unknown as { mailService: MailServiceLike }
    ).mailService;
    let capturedToken = '';
    jest
      .spyOn(mailServiceInstance, 'sendConfirmationEmail')
      .mockImplementationOnce((_e: string, _n: string, t: string) => {
        capturedToken = t;
        return Promise.resolve();
      });

    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password });
    await request(app.getHttpServer())
      .get('/auth/confirm-email')
      .query({ token: capturedToken });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    const userId = (registerRes.body as { id: string }).id;
    const channel = await channelsService.findByUserId(userId);

    return {
      userId,
      channelId: channel?.id ?? '',
      accessToken: (loginRes.body as { access_token: string }).access_token,
    };
  }

  let counter = 0;
  async function createVideo(overrides: Partial<Video> = {}): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `vis${++counter}`,
        channel_id: owner.channelId,
        title: 'Vídeo do dono',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        storage_key: 'videos/streamable-key.mp4',
        ...overrides,
      }),
    );
  }

  const publicReady = () =>
    createVideo({
      published_at: new Date(),
      visibility: VideoVisibility.PUBLIC,
    });
  const unlistedReady = () =>
    createVideo({
      published_at: new Date(),
      visibility: VideoVisibility.UNLISTED,
    });
  // published_at nulo é o que define rascunho, não o status.
  const draftReady = () => createVideo();

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();

    owner = await registerConfirmAndLogin();
    stranger = await registerConfirmAndLogin();
  }, 30000);

  // Cenário 1.1 do spec
  it('signs a published video for an anonymous caller, public or unlisted', async () => {
    const pub = await publicReady();
    const unlisted = await unlistedReady();

    const pubRes = await request(app.getHttpServer())
      .get(`/videos/${pub.public_id}/stream`)
      .redirects(0);
    expect(pubRes.status).toBe(302);
    expect(pubRes.headers.location).toContain(pub.storage_key);

    // Unlisted não é privado: quem tem o link assiste (TD-02).
    const unlistedRes = await request(app.getHttpServer())
      .get(`/videos/${unlisted.public_id}/stream`)
      .redirects(0);
    expect(unlistedRes.status).toBe(302);
  }, 30000);

  // Cenário 1.2 do spec
  it('hides a draft from an anonymous caller on both routes', async () => {
    const draft = await draftReady();

    const stream = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/stream`)
      .redirects(0);
    expect(stream.status).toBe(404);
    expect((stream.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');

    const download = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/download`)
      .redirects(0);
    expect(download.status).toBe(404);
    expect((download.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');
  }, 30000);

  // Cenário 1.3 do spec
  it('signs a draft for its owner', async () => {
    const draft = await draftReady();

    const res = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/stream`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .redirects(0);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain(draft.storage_key);
  }, 30000);

  // Cenário 1.4 do spec
  it('hides a draft from another authenticated user', async () => {
    const draft = await draftReady();

    const res = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/stream`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .redirects(0);

    // 404 e não 403: a existência do rascunho alheio não é revelada.
    expect(res.status).toBe(404);
    expect((res.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');
  }, 30000);

  // Cenário 1.5 do spec
  it('ignores an invalid token on a published video instead of returning 401', async () => {
    const pub = await publicReady();

    const res = await request(app.getHttpServer())
      .get(`/videos/${pub.public_id}/stream`)
      .set('Authorization', 'Bearer token-invalido')
      .redirects(0);

    expect(res.status).toBe(302);
  }, 30000);

  // Cenário 1.6 do spec
  it('returns 409 for a published video that is not ready', async () => {
    const processing = await createVideo({
      status: VideoStatus.PROCESSING,
      published_at: new Date(),
    });

    const res = await request(app.getHttpServer())
      .get(`/videos/${processing.public_id}/stream`)
      .redirects(0);

    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toBe('VIDEO_NOT_READY');
  }, 30000);

  // Cenário 1.7 do spec
  it('applies the same rules to download', async () => {
    const pub = await publicReady();
    const draft = await draftReady();

    const anonymous = await request(app.getHttpServer())
      .get(`/videos/${pub.public_id}/download`)
      .redirects(0);
    expect(anonymous.status).toBe(302);
    expect(anonymous.headers.location).toContain(
      'response-content-disposition',
    );

    const byStranger = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/download`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .redirects(0);
    expect(byStranger.status).toBe(404);
    expect((byStranger.body as { error: string }).error).toBe(
      'VIDEO_NOT_FOUND',
    );

    const byOwner = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/download`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .redirects(0);
    expect(byOwner.status).toBe(302);
  }, 30000);
});

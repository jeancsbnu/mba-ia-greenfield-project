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
import { ThrottlerExceptionFilter } from '../src/common/filters/throttler-exception.filter';
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

// Spec: nestjs-project/specs/videos-view-count.plan.md (SI-05.3)
// Primeiro endpoint de escrita público do projeto (TD-03, Option B). O
// orçamento próprio de 30/60 s por IP vem do TD-05 (Revisions de 2026-09-29)
// e existe para que navegação legítima não colida com o de login.
describe('videos-view-count', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelsService: ChannelsService;
  let throttlerStorage: ThrottlerStorageService;
  let bucket: string;

  let owner: AuthenticatedUser;

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
      new ThrottlerExceptionFilter(),
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
    const email = `view_count_${++emailCounter}@example.com`;
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
        public_id: `vc${++counter}`,
        channel_id: owner.channelId,
        title: 'Vídeo do dono',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        storage_key: 'videos/streamable-key.mp4',
        views_count: 0,
        ...overrides,
      }),
    );
  }

  const publicReady = () =>
    createVideo({
      published_at: new Date(),
      visibility: VideoVisibility.PUBLIC,
    });
  // published_at nulo é o que define rascunho, não o status.
  const draftReady = () => createVideo();

  async function readViewsCount(id: string): Promise<number> {
    const video = await videoRepository.findOneByOrFail({ id });
    return Number(video.views_count);
  }

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    // O contador do throttler é em memória e vazaria entre cenários.
    throttlerStorage.storage.clear();

    owner = await registerConfirmAndLogin();
  }, 30000);

  // 1. Incremento da contagem

  // Cenário 1.1 do spec — AC #1
  it('increments the counter for an anonymous visitor, without deduplication', async () => {
    const video = await publicReady();

    const before = await request(app.getHttpServer()).get(
      `/videos/${video.public_id}/public`,
    );
    expect((before.body as { viewsCount: number }).viewsCount).toBe(0);

    const registered = await request(app.getHttpServer()).post(
      `/videos/${video.public_id}/view`,
    );
    expect(registered.status).toBe(204);
    expect(registered.body).toEqual({});

    const afterOne = await request(app.getHttpServer()).get(
      `/videos/${video.public_id}/public`,
    );
    expect((afterOne.body as { viewsCount: number }).viewsCount).toBe(1);

    // Sem deduplicação por visitante nesta fase (TD-03, Option B).
    await request(app.getHttpServer()).post(`/videos/${video.public_id}/view`);
    await request(app.getHttpServer()).post(`/videos/${video.public_id}/view`);

    const afterThree = await request(app.getHttpServer()).get(
      `/videos/${video.public_id}/public`,
    );
    expect((afterThree.body as { viewsCount: number }).viewsCount).toBe(3);
  }, 30000);

  // Cenário 1.2 do spec — AC #4
  it('neither counts nor reveals a draft belonging to someone else', async () => {
    const draft = await draftReady();

    const onDraft = await request(app.getHttpServer()).post(
      `/videos/${draft.public_id}/view`,
    );
    expect(onDraft.status).toBe(404);
    expect((onDraft.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');

    const onMissing = await request(app.getHttpServer()).post(
      '/videos/doesnotexist/view',
    );
    expect(onMissing.status).toBe(404);
    expect(onMissing.body).toEqual(onDraft.body);

    // A tentativa negada não pode ter incrementado nada.
    expect(await readViewsCount(draft.id)).toBe(0);
  }, 30000);

  // 2. Orçamento de rate limit próprio da rota

  // Cenário 2.1 do spec — AC #2
  it('allows 30 requests per 60 s per IP and rejects the 31st', async () => {
    const video = await publicReady();

    for (let i = 0; i < 30; i++) {
      const res = await request(app.getHttpServer()).post(
        `/videos/${video.public_id}/view`,
      );
      expect(res.status).toBe(204);
    }
    expect(await readViewsCount(video.id)).toBe(30);

    const blocked = await request(app.getHttpServer()).post(
      `/videos/${video.public_id}/view`,
    );
    expect(blocked.status).toBe(429);
    expect((blocked.body as { error: string }).error).toBe(
      'RATE_LIMIT_EXCEEDED',
    );

    // A requisição barrada não chegou ao handler, logo não contou.
    expect(await readViewsCount(video.id)).toBe(30);
  }, 60000);

  // Cenário 2.2 do spec — AC #3
  it('keeps the route budget independent from the auth budget', async () => {
    const video = await publicReady();

    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrongpassword' });
    }
    const blockedLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrongpassword' });
    expect(blockedLogin.status).toBe(429);

    // Mesma janela, mesmo IP: o orçamento da contagem é outro.
    const registered = await request(app.getHttpServer()).post(
      `/videos/${video.public_id}/view`,
    );
    expect(registered.status).toBe(204);
  }, 60000);
});

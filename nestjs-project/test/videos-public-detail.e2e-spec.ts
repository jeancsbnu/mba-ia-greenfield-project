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

// Spec: nestjs-project/specs/videos-public-detail.plan.md (SI-05.2)
// Leitura pública do vídeo: a rota que a watch page consome. Guardada por
// assertServable (TD-02 de video-channel-management, revisão de 2026-09-20),
// e carregando as duas URLs pré-assinadas de 6 h juntas (TD-02 desta fase,
// Clarification de 2026-09-24).
describe('videos-public-detail', () => {
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
    const email = `public_detail_${++emailCounter}@example.com`;
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
        public_id: `pd${++counter}`,
        channel_id: owner.channelId,
        title: 'Aula de POO',
        description: 'Uma introdução a objetos.',
        status: VideoStatus.READY,
        duration_seconds: 420,
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

  // 1. Acesso público conforme o estado de publicação

  // Cenário 1.1 do spec — AC #1
  it('serves a published video to an anonymous caller with both presigned URLs', async () => {
    const video = await publicReady();
    const ownerChannel = await channelsService.findByIdOrFail(owner.channelId);

    const res = await request(app.getHttpServer()).get(
      `/videos/${video.public_id}/public`,
    );

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body.title).toBe('Aula de POO');
    expect(body.description).toBe('Uma introdução a objetos.');
    expect(body.durationSeconds).toBe(420);
    expect(body.category).toBeDefined();
    expect(body.publishedAt).toEqual(expect.any(String));
    expect(typeof body.viewsCount).toBe('number');
    expect(body.channel).toEqual({
      nickname: ownerChannel.nickname,
      name: ownerChannel.name,
    });

    // As duas URLs são pré-assinadas sobre a mesma chave de objeto; só a de
    // download carrega o content-disposition que força o salvamento.
    const streamUrl = body.streamUrl as string;
    const downloadUrl = body.downloadUrl as string;
    expect(streamUrl).toContain(video.storage_key);
    expect(streamUrl).toContain('X-Amz-Signature');
    expect(downloadUrl).toContain(video.storage_key);
    expect(downloadUrl).toContain('X-Amz-Signature');
    expect(decodeURIComponent(downloadUrl)).toContain(
      'attachment; filename="aula-de-poo.mp4"',
    );
  }, 30000);

  // Cenário 1.2 do spec — AC #3
  it('serves an unlisted published video by direct link, in the same shape', async () => {
    const pub = await publicReady();
    const unlisted = await unlistedReady();

    const unlistedRes = await request(app.getHttpServer()).get(
      `/videos/${unlisted.public_id}/public`,
    );
    const publicRes = await request(app.getHttpServer()).get(
      `/videos/${pub.public_id}/public`,
    );

    expect(unlistedRes.status).toBe(200);
    // unlisted restringe listagem, não acesso direto: mesma superfície.
    expect(Object.keys(unlistedRes.body as object).sort()).toEqual(
      Object.keys(publicRes.body as object).sort(),
    );
    expect((unlistedRes.body as { visibility: string }).visibility).toBe(
      VideoVisibility.UNLISTED,
    );
  }, 30000);

  // Cenário 1.3 do spec — AC #2
  it('makes a draft indistinguishable from a video that does not exist', async () => {
    const draft = await draftReady();

    const anonymous = await request(app.getHttpServer()).get(
      `/videos/${draft.public_id}/public`,
    );
    expect(anonymous.status).toBe(404);
    expect((anonymous.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');

    const asStranger = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/public`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(asStranger.status).toBe(404);
    expect((asStranger.body as { error: string }).error).toBe(
      'VIDEO_NOT_FOUND',
    );

    // A existência do vídeo não é revelada: mesma resposta, byte a byte.
    const missing = await request(app.getHttpServer()).get(
      '/videos/doesnotexist/public',
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual(anonymous.body);

    const asOwner = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/public`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(asOwner.status).toBe(200);
  }, 30000);

  // 2. Superfície da projeção pública

  // Cenário 2.1 do spec — AC #4
  it('never leaks owner operation fields, not even to the owner', async () => {
    const published = await publicReady();
    const draft = await draftReady();
    const leaked = [
      'upload_id',
      'processing_error',
      'storage_key',
      'storage_bucket',
    ];

    const anonymous = await request(app.getHttpServer()).get(
      `/videos/${published.public_id}/public`,
    );
    for (const key of leaked) {
      expect(anonymous.body).not.toHaveProperty(key);
    }

    // Ser dono não amplia a superfície desta rota — é a mesma projeção.
    const asOwner = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}/public`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    for (const key of leaked) {
      expect(asOwner.body).not.toHaveProperty(key);
    }
    expect(Object.keys(asOwner.body as object).sort()).toEqual(
      Object.keys(anonymous.body as object).sort(),
    );
  }, 30000);

  // Cenário 2.2 do spec — AC #5
  it('leaves the Fase 03 status route owner-only', async () => {
    const video = await publicReady();

    const anonymous = await request(app.getHttpServer()).get(
      `/videos/${video.public_id}`,
    );
    expect(anonymous.status).toBe(401);

    const asStranger = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);
    expect(asStranger.status).toBe(403);

    const asOwner = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(asOwner.status).toBe(200);
    // A forma da Fase 03 segue inalterada por esta fase.
    expect(asOwner.body).toHaveProperty('status');
    expect(asOwner.body).toHaveProperty('createdAt');
    expect(asOwner.body).not.toHaveProperty('streamUrl');
  }, 30000);
});

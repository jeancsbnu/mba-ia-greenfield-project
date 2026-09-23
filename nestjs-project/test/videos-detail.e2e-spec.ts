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
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from '../src/videos/entities/video.entity';

// O AuthService guarda o mailService como membro privado; o e2e precisa
// interceptar o envio para capturar o token de confirmação.
interface MailServiceLike {
  sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}

interface AuthenticatedUser {
  userId: string;
  accessToken: string;
  channelId: string;
}

// Spec: nestjs-project/specs/videos-detail.plan.md (SI-04.2)
describe('GET /videos/:publicId — detalhe do dono estendido (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelsService: ChannelsService;
  let throttlerStorage: ThrottlerStorageService;
  let bucket: string;

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

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();
  });

  let emailCounter = 0;
  async function registerConfirmAndLogin(): Promise<AuthenticatedUser> {
    const email = `videos_detail_${++emailCounter}@example.com`;
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
      accessToken: (loginRes.body as { access_token: string }).access_token,
      channelId: channel?.id ?? '',
    };
  }

  let videoCounter = 0;
  async function createVideo(
    channelId: string,
    overrides: Partial<Video> = {},
  ): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `det${++videoCounter}`,
        channel_id: channelId,
        title: 'Vídeo de detalhe',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        ...overrides,
      }),
    );
  }

  // Cenário 1.1 do spec
  it('returns the Fase 04 fields for a draft and for a published video', async () => {
    const owner = await registerConfirmAndLogin();

    const draft = await createVideo(owner.channelId, {
      description: 'Descrição do rascunho',
      duration_seconds: 492,
    });

    const draftRes = await request(app.getHttpServer())
      .get(`/videos/${draft.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(draftRes.status).toBe(200);
    expect(draftRes.body).toMatchObject({
      publicId: draft.public_id,
      title: 'Vídeo de detalhe',
      description: 'Descrição do rascunho',
      status: VideoStatus.READY,
      durationSeconds: 492,
      category: VideoCategory.OUTROS,
      visibility: VideoVisibility.PUBLIC,
      publishedAt: null,
    });
    expect(draftRes.body).toHaveProperty('createdAt');
    expect(draftRes.body).toHaveProperty('thumbnailUrl');

    const published = await createVideo(owner.channelId, {
      category: VideoCategory.MUSICA,
      visibility: VideoVisibility.UNLISTED,
      published_at: new Date('2026-07-28T12:00:00.000Z'),
    });

    const publishedRes = await request(app.getHttpServer())
      .get(`/videos/${published.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(publishedRes.status).toBe(200);
    expect(publishedRes.body).toMatchObject({
      category: VideoCategory.MUSICA,
      visibility: VideoVisibility.UNLISTED,
    });
    expect(
      (publishedRes.body as { publishedAt: string }).publishedAt,
    ).toContain('2026-07-28');
  }, 30000);

  // Cenário 1.2 do spec
  it('resolves thumbnailUrl to the custom thumbnail when present, else the generated one', async () => {
    const owner = await registerConfirmAndLogin();

    const autoOnly = await createVideo(owner.channelId, {
      thumbnail_key: 'auto/generated.jpg',
    });
    const autoRes = await request(app.getHttpServer())
      .get(`/videos/${autoOnly.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(autoRes.status).toBe(200);
    expect((autoRes.body as { thumbnailUrl: string }).thumbnailUrl).toContain(
      'auto/generated.jpg',
    );

    const withCustom = await createVideo(owner.channelId, {
      thumbnail_key: 'auto/generated.jpg',
      custom_thumbnail_key: 'custom/uploaded.png',
    });
    const customRes = await request(app.getHttpServer())
      .get(`/videos/${withCustom.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    const customUrl = (customRes.body as { thumbnailUrl: string }).thumbnailUrl;
    expect(customUrl).toContain('custom/uploaded.png');
    expect(customUrl).not.toContain('auto/generated.jpg');
  }, 30000);

  // Cenário 1.3 do spec
  it('returns thumbnailUrl null when the video has no thumbnail', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    expect(
      (res.body as { thumbnailUrl: string | null }).thumbnailUrl,
    ).toBeNull();
  }, 30000);

  // Cenário 1.4 do spec
  it('rejects another channel video with 403 and an unknown publicId with 404', async () => {
    const owner = await registerConfirmAndLogin();
    const stranger = await registerConfirmAndLogin();

    const video = await createVideo(owner.channelId);

    const forbidden = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`);

    expect(forbidden.status).toBe(403);
    expect((forbidden.body as { error: string }).error).toBe('FORBIDDEN');

    const notFound = await request(app.getHttpServer())
      .get('/videos/inexistente1')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(notFound.status).toBe(404);
    expect((notFound.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');
  }, 30000);
});

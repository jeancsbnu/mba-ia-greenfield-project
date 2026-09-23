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

interface MailServiceLike {
  sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}

interface AuthenticatedUser {
  accessToken: string;
  channelId: string;
}

// PNG 1x1 real: o FileTypeValidator do Nest 11 inspeciona os magic numbers via
// pacote `file-type`, então um buffer de texto seria rejeitado — que é
// exatamente a validação no servidor exigida pelo TD-03.
const PNG_BYTES = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

// Spec: nestjs-project/specs/videos-update.plan.md (SI-04.3)
describe('PATCH /videos/:publicId — edição, thumbnail e publicação (e2e)', () => {
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
    const email = `videos_update_${++emailCounter}@example.com`;
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
        public_id: `upd${++videoCounter}`,
        channel_id: channelId,
        title: 'Título original',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        ...overrides,
      }),
    );
  }

  // Cenário 1.1 do spec
  it('edits text fields, category and visibility', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const res = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('title', 'Novo título')
      .field('description', 'Nova descrição')
      .field('category', VideoCategory.EDUCACAO)
      .field('visibility', VideoVisibility.UNLISTED);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      title: 'Novo título',
      description: 'Nova descrição',
      category: VideoCategory.EDUCACAO,
      visibility: VideoVisibility.UNLISTED,
      publishedAt: null,
    });

    const get = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(get.body).toMatchObject({
      title: 'Novo título',
      category: VideoCategory.EDUCACAO,
    });
  }, 30000);

  // Cenário 1.2 do spec
  it('publishes a ready video and keeps publishedAt stable on repeat', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const first = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('published', 'true');

    expect(first.status).toBe(200);
    const firstPublishedAt = (first.body as { publishedAt: string })
      .publishedAt;
    expect(firstPublishedAt).not.toBeNull();

    const second = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('published', 'true');

    expect(second.status).toBe(200);
    expect((second.body as { publishedAt: string }).publishedAt).toBe(
      firstPublishedAt,
    );
  }, 30000);

  // Cenário 1.3 do spec
  it('refuses to publish a video that is still processing', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId, {
      status: VideoStatus.PROCESSING,
    });

    const res = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('published', 'true');

    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toBe('VIDEO_NOT_PUBLISHABLE');

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.published_at).toBeNull();
  }, 30000);

  // Cenário 1.4 do spec
  it('unpublishes whatever the status is', async () => {
    const owner = await registerConfirmAndLogin();
    const published = await createVideo(owner.channelId, {
      published_at: new Date(),
    });

    const res = await request(app.getHttpServer())
      .patch(`/videos/${published.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('published', 'false');

    expect(res.status).toBe(200);
    expect((res.body as { publishedAt: string | null }).publishedAt).toBeNull();

    const processing = await createVideo(owner.channelId, {
      status: VideoStatus.PROCESSING,
    });
    const other = await request(app.getHttpServer())
      .patch(`/videos/${processing.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('published', 'false');

    expect(other.status).toBe(200);
  }, 30000);

  // Cenário 1.5 do spec
  it('replaces the custom thumbnail and rejects invalid files', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId, {
      thumbnail_key: 'auto/generated.jpg',
    });

    const ok = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach('thumbnail', PNG_BYTES, {
        filename: 'nova.png',
        contentType: 'image/png',
      });

    expect(ok.status).toBe(200);
    expect((ok.body as { thumbnailUrl: string }).thumbnailUrl).toContain(
      'thumbnails/',
    );

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.thumbnail_key).toBe('auto/generated.jpg');
    expect(stored.custom_thumbnail_key).not.toBeNull();

    const wrongType = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach('thumbnail', Buffer.from('texto'), {
        filename: 'nota.txt',
        contentType: 'text/plain',
      });

    expect(wrongType.status).toBe(400);

    const tooLarge = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach(
        'thumbnail',
        Buffer.concat([PNG_BYTES, Buffer.alloc(2 * 1024 * 1024)]),
        {
          filename: 'grande.png',
          contentType: 'image/png',
        },
      );

    expect([400, 413]).toContain(tooLarge.status);

    const afterFailures = await videoRepository.findOneByOrFail({
      id: video.id,
    });
    expect(afterFailures.custom_thumbnail_key).toBe(
      stored.custom_thumbnail_key,
    );
  }, 30000);

  // Cenário 1.6 do spec
  it('validates text fields', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const badCategory = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('category', 'Tutoriais');

    expect(badCategory.status).toBe(400);

    const emptyTitle = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('title', '');

    expect(emptyTitle.status).toBe(400);

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.title).toBe('Título original');
  }, 30000);

  // Regressão: com useDefineForClassFields as propriedades opcionais existem
  // como undefined, então contar Object.keys nunca detectava corpo vazio.
  it('rejects a request with neither fields nor file', async () => {
    const owner = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const res = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(400);
  }, 30000);

  // Cenário 1.7 do spec
  it('rejects another channel video with 403 and an unknown publicId with 404', async () => {
    const owner = await registerConfirmAndLogin();
    const stranger = await registerConfirmAndLogin();
    const video = await createVideo(owner.channelId);

    const forbidden = await request(app.getHttpServer())
      .patch(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .field('title', 'Invasão');

    expect(forbidden.status).toBe(403);
    expect((forbidden.body as { error: string }).error).toBe('FORBIDDEN');

    const notFound = await request(app.getHttpServer())
      .patch('/videos/inexistente1')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('title', 'Fantasma');

    expect(notFound.status).toBe(404);
    expect((notFound.body as { error: string }).error).toBe('VIDEO_NOT_FOUND');
  }, 30000);
});

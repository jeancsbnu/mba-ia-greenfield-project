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
import { Video, VideoStatus } from '../src/videos/entities/video.entity';

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

interface VideoListItem {
  publicId: string;
  title: string;
  publishedAt: string | null;
}

interface VideoListEnvelope {
  items: VideoListItem[];
  total: number;
  offset: number;
  limit: number;
}

// Spec: nestjs-project/specs/me-videos.plan.md (SI-04.4)
describe('GET /me/videos — painel do canal (e2e)', () => {
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
    const email = `me_videos_${++emailCounter}@example.com`;
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
        public_id: `mev${++videoCounter}`,
        channel_id: channelId,
        title: `Vídeo ${videoCounter}`,
        status: VideoStatus.READY,
        storage_bucket: bucket,
        ...overrides,
      }),
    );
  }

  // Cenário 1.1 do spec
  it('returns the full envelope with every item field', async () => {
    const owner = await registerConfirmAndLogin();
    const stranger = await registerConfirmAndLogin();

    await createVideo(owner.channelId, { title: 'Rascunho' });
    await createVideo(owner.channelId, {
      title: 'Publicado',
      published_at: new Date(),
    });
    const foreign = await createVideo(stranger.channelId, {
      title: 'De outro canal',
    });

    const res = await request(app.getHttpServer())
      .get('/me/videos')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    const body = res.body as VideoListEnvelope;

    expect(body.total).toBe(2);
    expect(body.offset).toBe(0);
    expect(body.limit).toBe(10);
    expect(body.items).toHaveLength(2);

    expect(body.items[0]).toEqual(
      expect.objectContaining({
        publicId: expect.any(String) as string,
        title: expect.any(String) as string,
        status: expect.any(String) as string,
        visibility: expect.any(String) as string,
        viewsCount: expect.any(Number) as number,
        likesCount: expect.any(Number) as number,
        commentsCount: expect.any(Number) as number,
      }),
    );

    // Rascunhos entram na lista do painel; vídeos de outro canal nunca.
    expect(body.items.some((item) => item.publishedAt === null)).toBe(true);
    expect(body.items.map((item) => item.publicId)).not.toContain(
      foreign.public_id,
    );
  }, 30000);

  // Cenário 1.2 do spec
  it('paginates with offset and limit, newest first', async () => {
    const owner = await registerConfirmAndLogin();
    for (let i = 0; i < 12; i++) {
      await createVideo(owner.channelId, { title: `Vídeo ${i}` });
    }

    const firstPage = await request(app.getHttpServer())
      .get('/me/videos')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(firstPage.status).toBe(200);
    expect((firstPage.body as VideoListEnvelope).items).toHaveLength(10);
    expect((firstPage.body as VideoListEnvelope).total).toBe(12);

    const secondPage = await request(app.getHttpServer())
      .get('/me/videos')
      .query({ offset: 10, limit: 10 })
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect((secondPage.body as VideoListEnvelope).items).toHaveLength(2);
    expect((secondPage.body as VideoListEnvelope).total).toBe(12);

    const smallPage = await request(app.getHttpServer())
      .get('/me/videos')
      .query({ offset: 0, limit: 5 })
      .set('Authorization', `Bearer ${owner.accessToken}`);

    const small = smallPage.body as VideoListEnvelope;
    expect(small.items).toHaveLength(5);
    expect(small.limit).toBe(5);
    // O último criado vem primeiro.
    expect(small.items[0].title).toBe('Vídeo 11');
  }, 30000);

  // Cenário 1.3 do spec
  it('rejects pagination values out of range', async () => {
    const owner = await registerConfirmAndLogin();

    const tooBig = await request(app.getHttpServer())
      .get('/me/videos')
      .query({ limit: 51 })
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(tooBig.status).toBe(400);

    const negative = await request(app.getHttpServer())
      .get('/me/videos')
      .query({ offset: -1 })
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect(negative.status).toBe(400);
  }, 30000);

  // Cenário 1.4 do spec
  it('requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/me/videos');
    expect(res.status).toBe(401);
  }, 30000);
});

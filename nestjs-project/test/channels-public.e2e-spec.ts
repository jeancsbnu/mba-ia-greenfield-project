import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Channel } from '../src/channels/entities/channel.entity';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import storageConfig from '../src/config/storage.config';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { User } from '../src/users/entities/user.entity';
import {
  Video,
  VideoStatus,
  VideoVisibility,
} from '../src/videos/entities/video.entity';

interface PublicChannelResponse {
  name: string;
  nickname: string;
  description: string | null;
  videosCount: number;
}

interface PublicVideoItem {
  publicId: string;
  title: string;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  viewsCount: number;
  publishedAt: string;
}

interface PublicVideosEnvelope {
  items: PublicVideoItem[];
  total: number;
  offset: number;
  limit: number;
}

// Spec: nestjs-project/specs/channels-public.plan.md (SI-04.6)
// Nenhum cenário usa token: as duas rotas são públicas.
describe('GET /channels/:nickname e /videos — canal público (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelRepository: Repository<Channel>;
  let userRepository: Repository<User>;
  let throttlerStorage: ThrottlerStorageService;
  let bucket: string;
  let channelId: string;

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
    channelRepository = dataSource.getRepository(Channel);
    userRepository = dataSource.getRepository(User);
    throttlerStorage =
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage);
    bucket = app.get<ConfigType<typeof storageConfig>>(
      storageConfig.KEY,
    ).minioBucket;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  let counter = 0;
  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();

    const user = await userRepository.save(
      userRepository.create({
        email: `public_channel_${++counter}@example.com`,
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Joana Cria',
        nickname: 'joana_cria',
        description: 'Vídeos de culinária',
        user_id: user.id,
      }),
    );
    channelId = channel.id;
  });

  async function createVideo(overrides: Partial<Video> = {}): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `pub${++counter}`,
        channel_id: channelId,
        title: `Vídeo ${counter}`,
        status: VideoStatus.READY,
        storage_bucket: bucket,
        ...overrides,
      }),
    );
  }

  async function seedShowcase(publicCount: number) {
    for (let i = 0; i < publicCount; i++) {
      await createVideo({
        title: `Público ${i}`,
        published_at: new Date(Date.UTC(2026, 6, i + 1)),
      });
    }
    // Fora da vitrine: rascunhos e "Indisponível".
    await createVideo({ title: 'Rascunho A' });
    await createVideo({ title: 'Rascunho B' });
    await createVideo({
      title: 'Indisponível',
      visibility: VideoVisibility.UNLISTED,
      published_at: new Date('2026-07-31T12:00:00.000Z'),
    });
  }

  // Cenário 1.1 do spec
  it('returns the public channel data with a count of public videos only', async () => {
    await seedShowcase(10);

    const res = await request(app.getHttpServer()).get('/channels/joana_cria');

    expect(res.status).toBe(200);
    const body = res.body as PublicChannelResponse;
    expect(body.name).toBe('Joana Cria');
    expect(body.nickname).toBe('joana_cria');
    expect(body.description).toBe('Vídeos de culinária');
    // 10 públicos; 2 rascunhos e 1 unlisted ficam de fora.
    expect(body.videosCount).toBe(10);
  }, 30000);

  // Cenário 1.2 do spec
  it('lists published public videos newest first, eight per page by default', async () => {
    await seedShowcase(10);

    const firstPage = await request(app.getHttpServer()).get(
      '/channels/joana_cria/videos',
    );

    expect(firstPage.status).toBe(200);
    const first = firstPage.body as PublicVideosEnvelope;
    expect(first.total).toBe(10);
    expect(first.offset).toBe(0);
    expect(first.limit).toBe(8);
    expect(first.items).toHaveLength(8);

    expect(first.items[0]).toEqual(
      expect.objectContaining({
        publicId: expect.any(String) as string,
        title: expect.any(String) as string,
        viewsCount: expect.any(Number) as number,
        publishedAt: expect.any(String) as string,
      }),
    );

    // Mais recente primeiro.
    expect(first.items[0].title).toBe('Público 9');

    const titles = first.items.map((item) => item.title);
    expect(titles).not.toContain('Rascunho A');
    expect(titles).not.toContain('Indisponível');

    const secondPage = await request(app.getHttpServer())
      .get('/channels/joana_cria/videos')
      .query({ offset: 8, limit: 8 });

    const second = secondPage.body as PublicVideosEnvelope;
    expect(second.items).toHaveLength(2);
    expect(second.total).toBe(10);
  }, 30000);

  // Cenário 1.3 do spec
  it('returns 404 for an unknown nickname on both routes', async () => {
    const channel = await request(app.getHttpServer()).get(
      '/channels/nao_existe',
    );
    expect(channel.status).toBe(404);
    expect((channel.body as { error: string }).error).toBe('CHANNEL_NOT_FOUND');

    const videos = await request(app.getHttpServer()).get(
      '/channels/nao_existe/videos',
    );
    expect(videos.status).toBe(404);
    expect((videos.body as { error: string }).error).toBe('CHANNEL_NOT_FOUND');
  }, 30000);

  // Cenário 1.4 do spec
  it('rejects pagination values out of range', async () => {
    const tooBig = await request(app.getHttpServer())
      .get('/channels/joana_cria/videos')
      .query({ limit: 51 });
    expect(tooBig.status).toBe(400);

    const negative = await request(app.getHttpServer())
      .get('/channels/joana_cria/videos')
      .query({ offset: -1 });
    expect(negative.status).toBe(400);
  }, 30000);

  it('returns an empty showcase for a channel with only drafts', async () => {
    await createVideo({ title: 'Só rascunho' });

    const channel = await request(app.getHttpServer()).get(
      '/channels/joana_cria',
    );
    expect((channel.body as PublicChannelResponse).videosCount).toBe(0);

    const videos = await request(app.getHttpServer()).get(
      '/channels/joana_cria/videos',
    );
    const body = videos.body as PublicVideosEnvelope;
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  }, 30000);
});

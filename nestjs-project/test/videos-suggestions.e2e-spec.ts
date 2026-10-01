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
  userId: string;
  channelId: string;
  accessToken: string;
}

interface SuggestionItem {
  publicId: string;
  title: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewsCount: number;
  publishedAt: string;
  channel: { nickname: string; name: string };
}

interface SuggestionsPage {
  items: SuggestionItem[];
  total: number;
}

// Spec: nestjs-project/specs/videos-suggestions.plan.md (SI-05.4)
// Sugestões determinísticas (TD-04, Option A): mesma categoria, published_at
// desc, excluindo o próprio vídeo, rascunhos e unlisted. A revisão de
// 2026-09-26 fixou o recorte em 4 por página com "ver mais".
describe('videos-suggestions', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelsService: ChannelsService;
  let throttlerStorage: ThrottlerStorageService;
  let bucket: string;

  let owner: AuthenticatedUser;
  let reference: Video;

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
    const email = `suggestions_${++emailCounter}@example.com`;
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
        public_id: `sg${++counter}`,
        channel_id: owner.channelId,
        title: 'Vídeo',
        status: VideoStatus.READY,
        category: VideoCategory.EDUCACAO,
        duration_seconds: 300,
        views_count: 0,
        storage_bucket: bucket,
        storage_key: 'videos/streamable-key.mp4',
        ...overrides,
      }),
    );
  }

  // Seis elegíveis em EDUCACAO, do mais novo ao mais antigo, mais o vídeo de
  // referência e os três casos que a consulta tem de excluir.
  let eligibleNewestFirst: Video[];
  let draft: Video;
  let unlisted: Video;

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();

    owner = await registerConfirmAndLogin();

    const base = Date.UTC(2026, 8, 20, 12, 0, 0);
    eligibleNewestFirst = [];
    for (let i = 0; i < 6; i++) {
      // i = 0 é o mais novo; cada seguinte recua um dia.
      eligibleNewestFirst.push(
        await createVideo({
          title: `Elegível ${i}`,
          published_at: new Date(base - i * 86_400_000),
          visibility: VideoVisibility.PUBLIC,
        }),
      );
    }

    reference = await createVideo({
      title: 'Vídeo de referência',
      published_at: new Date(base + 86_400_000),
      visibility: VideoVisibility.PUBLIC,
    });

    unlisted = await createVideo({
      title: 'Indisponível',
      published_at: new Date(base),
      visibility: VideoVisibility.UNLISTED,
    });
    // published_at nulo é o que define rascunho, não o status.
    draft = await createVideo({
      title: 'Rascunho',
      visibility: VideoVisibility.PUBLIC,
    });

    await createVideo({
      title: 'Outra categoria A',
      category: VideoCategory.JOGOS,
      published_at: new Date(base),
      visibility: VideoVisibility.PUBLIC,
    });
    await createVideo({
      title: 'Outra categoria B',
      category: VideoCategory.MUSICA,
      published_at: new Date(base),
      visibility: VideoVisibility.PUBLIC,
    });
  }, 30000);

  function get(query = ''): request.Test {
    return request(app.getHttpServer()).get(
      `/videos/${reference.public_id}/suggestions${query}`,
    );
  }

  // 1. Recorte, ordenação e exclusões

  // Cenário 1.1 do spec — AC #1
  it('returns the default page of 4 items plus the full total', async () => {
    const ownerChannel = await channelsService.findByIdOrFail(owner.channelId);

    const res = await get();

    expect(res.status).toBe(200);
    const page = res.body as SuggestionsPage;
    // O default de limit é 4 (TD-04, Revisions de 2026-09-26)...
    expect(page.items).toHaveLength(4);
    // ...e total conta todas as elegíveis, não só a página.
    expect(page.total).toBe(6);

    for (const item of page.items) {
      expect(item).toEqual({
        publicId: expect.any(String) as unknown,
        title: expect.any(String) as unknown,
        thumbnailUrl: null,
        durationSeconds: 300,
        viewsCount: 0,
        publishedAt: expect.any(String) as unknown,
        channel: { nickname: ownerChannel.nickname, name: ownerChannel.name },
      });
    }
  }, 30000);

  // Cenário 1.2 do spec — AC #2
  it('excludes the reference video, drafts, unlisted and other categories', async () => {
    const res = await get('?limit=50');

    const page = res.body as SuggestionsPage;
    const ids = page.items.map((item) => item.publicId);

    expect(ids).not.toContain(reference.public_id);
    expect(ids).not.toContain(draft.public_id);
    expect(ids).not.toContain(unlisted.public_id);
    expect(ids.sort()).toEqual(
      eligibleNewestFirst.map((video) => video.public_id).sort(),
    );
    expect(page.total).toBe(6);
  }, 30000);

  // Cenário 1.3 do spec — AC #3
  it('orders the items by publication date, newest first', async () => {
    const res = await get('?limit=6');

    const page = res.body as SuggestionsPage;
    const timestamps = page.items.map((item) =>
      new Date(item.publishedAt).getTime(),
    );

    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i - 1]).toBeGreaterThan(timestamps[i]);
    }
    expect(page.items[0].publicId).toBe(eligibleNewestFirst[0].public_id);
  }, 30000);

  // 2. Paginação

  // Cenário 2.1 do spec — AC #4
  it('pages with offset without repeating items, and runs out cleanly', async () => {
    const first = await get();
    const firstPage = first.body as SuggestionsPage;
    expect(firstPage.items).toHaveLength(4);

    const second = await get('?offset=4');
    expect(second.status).toBe(200);
    const secondPage = second.body as SuggestionsPage;
    expect(secondPage.items).toHaveLength(2);

    const firstIds = firstPage.items.map((item) => item.publicId);
    for (const item of secondPage.items) {
      expect(firstIds).not.toContain(item.publicId);
    }

    const beyond = await get('?offset=6');
    const beyondPage = beyond.body as SuggestionsPage;
    expect(beyondPage.items).toEqual([]);
    // total não depende da página pedida.
    expect(beyondPage.total).toBe(6);
  }, 30000);

  // Cenário 2.2 do spec — AC #5
  it('returns an empty list when the category has no other published video', async () => {
    const lonely = await createVideo({
      title: 'Único da categoria',
      category: VideoCategory.ESPORTES,
      published_at: new Date(),
      visibility: VideoVisibility.PUBLIC,
    });

    const res = await request(app.getHttpServer()).get(
      `/videos/${lonely.public_id}/suggestions`,
    );

    // Lista vazia é resultado legítimo, não erro: a consulta exclui o próprio
    // vídeo, então uma categoria com um único publicado devolve [].
    expect(res.status).toBe(200);
    const page = res.body as SuggestionsPage;
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  }, 30000);

  // Cenário 2.3 do spec — AC #6
  it('rejects out-of-range and non-numeric query parameters', async () => {
    for (const query of ['?limit=0', '?offset=-1', '?limit=abc']) {
      const res = await get(query);

      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toBe('VALIDATION_ERROR');
    }
  }, 30000);
});

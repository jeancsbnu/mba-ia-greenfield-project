import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import storageConfig from '../config/storage.config';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
import { ChannelsService } from '../channels/channels.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { Channel } from '../channels/entities/channel.entity';
import { VideoNotFoundException } from '../common/exceptions/domain.exception';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { User } from '../users/entities/user.entity';
import {
  Video,
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from './entities/video.entity';
import { VideosService } from './videos.service';

const SERVABLE_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
];

// Integração com o MinIO real: garante que a URL resolvida por TD-04 realmente
// serve o objeto certo, não só que a chave escolhida foi a esperada.
describe('VideosService.resolveThumbnailUrl (integration)', () => {
  let videosService: VideosService;
  let storageService: StorageService;
  let bucket: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [storageConfig] }),
        StorageModule,
      ],
      providers: [
        VideosService,
        {
          provide: getRepositoryToken(Video),
          useValue: {} as Repository<Video>,
        },
        { provide: ChannelsService, useValue: { findByUserId: jest.fn() } },
      ],
    }).compile();
    await module.init();

    videosService = module.get(VideosService);
    storageService = module.get(StorageService);
    bucket = storageConfig().minioBucket;
  }, 60000);

  function objectKey(name: string): string {
    return `test/thumb-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  }

  function buildVideo(overrides: Partial<Video>): Video {
    return {
      storage_bucket: bucket,
      thumbnail_key: null,
      custom_thumbnail_key: null,
      ...overrides,
    } as Video;
  }

  it('serves the worker-generated thumbnail when there is no custom one', async () => {
    const autoKey = objectKey('auto');
    await storageService.putObject(bucket, autoKey, 'auto-thumb', 'text/plain');

    const url = await videosService.resolveThumbnailUrl(
      buildVideo({ thumbnail_key: autoKey }),
    );

    expect(url).not.toBeNull();
    const response = await fetch(url as string);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('auto-thumb');
  }, 30000);

  it('serves the custom thumbnail when the owner uploaded one (TD-04)', async () => {
    const autoKey = objectKey('auto-ignored');
    const customKey = objectKey('custom');
    await storageService.putObject(bucket, autoKey, 'auto-thumb', 'text/plain');
    await storageService.putObject(
      bucket,
      customKey,
      'custom-thumb',
      'text/plain',
    );

    const url = await videosService.resolveThumbnailUrl(
      buildVideo({ thumbnail_key: autoKey, custom_thumbnail_key: customKey }),
    );

    const response = await fetch(url as string);
    expect(response.status).toBe(200);
    // O conteúdo prova a precedência: a URL aponta para a customizada.
    expect(await response.text()).toBe('custom-thumb');
  }, 30000);

  it('returns null when the video has no thumbnail', async () => {
    const url = await videosService.resolveThumbnailUrl(buildVideo({}));

    expect(url).toBeNull();
  });
});

// SI-04.7 — a precedência 404-antes-de-409 só se prova com vídeos reais no
// banco: o unitário não garante que assertServable roda antes de assertReady.
describe('VideosService.assertServable (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;
  let videoRepository: Repository<Video>;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;
  let ownerId: string;
  let otherUserId: string;

  beforeAll(async () => {
    dataSource = createTestDataSource(SERVABLE_ENTITIES);
    await dataSource.initialize();

    videoRepository = dataSource.getRepository(Video);
    userRepository = dataSource.getRepository(User);
    channelRepository = dataSource.getRepository(Channel);

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [storageConfig] }),
        StorageModule,
      ],
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: videoRepository },
        {
          provide: ChannelsService,
          // ChannelsService real exigiria o módulo inteiro; aqui basta a busca
          // por usuário, resolvida contra o mesmo banco do teste.
          useValue: {
            findByUserId: (userId: string) =>
              channelRepository.findOneBy({ user_id: userId }),
          },
        },
      ],
    }).compile();
    await module.init();

    videosService = module.get(VideosService);
  }, 60000);

  afterAll(async () => {
    await dataSource.destroy();
  });

  let servableCounter = 0;
  let channelId: string;

  beforeEach(async () => {
    await cleanAllTables(dataSource);

    const owner = await userRepository.save(
      userRepository.create({
        email: `servable_owner_${++servableCounter}@example.com`,
        password: 'hashed',
      }),
    );
    const other = await userRepository.save(
      userRepository.create({
        email: `servable_other_${servableCounter}@example.com`,
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Canal do dono',
        nickname: `dono_${servableCounter}`,
        user_id: owner.id,
      }),
    );

    ownerId = owner.id;
    otherUserId = other.id;
    channelId = channel.id;
  });

  async function persistVideo(overrides: Partial<Video>): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `srv${++servableCounter}`,
        channel_id: channelId,
        title: 'Vídeo',
        storage_bucket: 'videos',
        ...overrides,
      }),
    );
  }

  it('serves a published video to anyone', async () => {
    const video = await persistVideo({
      status: VideoStatus.READY,
      published_at: new Date(),
    });

    await expect(
      videosService.assertServable(video, undefined),
    ).resolves.toBeUndefined();
  }, 30000);

  it('serves a draft to its owner', async () => {
    const draft = await persistVideo({ status: VideoStatus.READY });

    await expect(
      videosService.assertServable(draft, ownerId),
    ).resolves.toBeUndefined();
  }, 30000);

  it('hides a draft from another authenticated user', async () => {
    const draft = await persistVideo({ status: VideoStatus.READY });

    await expect(
      videosService.assertServable(draft, otherUserId),
    ).rejects.toThrow(VideoNotFoundException);
  }, 30000);

  it('reports 404 before 409 for a draft that is not ready', async () => {
    // O vídeo é rascunho E não está pronto. Quem não é dono precisa ver
    // VIDEO_NOT_FOUND, não VIDEO_NOT_READY — o segundo revelaria a existência.
    const draft = await persistVideo({ status: VideoStatus.PROCESSING });

    await expect(
      videosService.assertServable(draft, undefined),
    ).rejects.toThrow(VideoNotFoundException);
  }, 30000);
});

// SI-05.3 — o incremento é atômico no banco. Um read-modify-write passaria
// nos testes sequenciais e perderia contagens exatamente quando mais importa:
// dois espectadores cruzando o limiar ao mesmo tempo.
describe('VideosService.registerView (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;
  let videoRepository: Repository<Video>;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;
  let channelId: string;

  beforeAll(async () => {
    dataSource = createTestDataSource(SERVABLE_ENTITIES);
    await dataSource.initialize();

    videoRepository = dataSource.getRepository(Video);
    userRepository = dataSource.getRepository(User);
    channelRepository = dataSource.getRepository(Channel);

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [storageConfig] }),
        StorageModule,
      ],
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: videoRepository },
        {
          provide: ChannelsService,
          useValue: {
            findByUserId: (userId: string) =>
              channelRepository.findOneBy({ user_id: userId }),
          },
        },
      ],
    }).compile();
    await module.init();

    videosService = module.get(VideosService);
  }, 60000);

  afterAll(async () => {
    await dataSource.destroy();
  });

  let viewCounter = 0;

  beforeEach(async () => {
    await cleanAllTables(dataSource);

    const owner = await userRepository.save(
      userRepository.create({
        email: `view_owner_${++viewCounter}@example.com`,
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Canal do dono',
        nickname: `view_dono_${viewCounter}`,
        user_id: owner.id,
      }),
    );
    channelId = channel.id;
  });

  async function persistPublished(): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `view${++viewCounter}`,
        channel_id: channelId,
        title: 'Vídeo',
        storage_bucket: 'videos',
        storage_key: 'videos/key.mp4',
        status: VideoStatus.READY,
        published_at: new Date(),
        views_count: 0,
      }),
    );
  }

  it('increments the counter by one', async () => {
    const video = await persistPublished();

    await videosService.registerView(video);

    const reloaded = await videoRepository.findOneByOrFail({ id: video.id });
    expect(Number(reloaded.views_count)).toBe(1);
  }, 30000);

  it('counts both of two concurrent registrations, not one', async () => {
    const video = await persistPublished();

    await Promise.all([
      videosService.registerView(video),
      videosService.registerView(video),
    ]);

    const reloaded = await videoRepository.findOneByOrFail({ id: video.id });
    expect(Number(reloaded.views_count)).toBe(2);
  }, 30000);
});

// SI-05.4 — as exclusões são o que define a lista de sugestões (TD-04).
// Testadas contra o banco real: uma cláusula WHERE errada passa num teste com
// repositório mockado e só falha em produção.
describe('VideosService.listSuggestions (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;
  let videoRepository: Repository<Video>;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;
  let channelId: string;

  beforeAll(async () => {
    dataSource = createTestDataSource(SERVABLE_ENTITIES);
    await dataSource.initialize();

    videoRepository = dataSource.getRepository(Video);
    userRepository = dataSource.getRepository(User);
    channelRepository = dataSource.getRepository(Channel);

    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [storageConfig] }),
        StorageModule,
      ],
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: videoRepository },
        {
          provide: ChannelsService,
          useValue: {
            findByUserId: (userId: string) =>
              channelRepository.findOneBy({ user_id: userId }),
          },
        },
      ],
    }).compile();
    await module.init();

    videosService = module.get(VideosService);
  }, 60000);

  afterAll(async () => {
    await dataSource.destroy();
  });

  let suggestionCounter = 0;
  const BASE = Date.UTC(2026, 8, 20, 12, 0, 0);

  let reference: Video;
  let eligibleNewestFirst: Video[];
  let draft: Video;
  let unlisted: Video;
  let otherCategory: Video;

  beforeEach(async () => {
    await cleanAllTables(dataSource);

    const owner = await userRepository.save(
      userRepository.create({
        email: `suggest_owner_${++suggestionCounter}@example.com`,
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Canal do dono',
        nickname: `suggest_dono_${suggestionCounter}`,
        user_id: owner.id,
      }),
    );
    channelId = channel.id;

    eligibleNewestFirst = [];
    for (let i = 0; i < 3; i++) {
      eligibleNewestFirst.push(
        await persistVideo({
          published_at: new Date(BASE - i * 86_400_000),
          visibility: VideoVisibility.PUBLIC,
        }),
      );
    }
    reference = await persistVideo({
      published_at: new Date(BASE + 86_400_000),
      visibility: VideoVisibility.PUBLIC,
    });
    unlisted = await persistVideo({
      published_at: new Date(BASE),
      visibility: VideoVisibility.UNLISTED,
    });
    draft = await persistVideo({ visibility: VideoVisibility.PUBLIC });
    otherCategory = await persistVideo({
      category: VideoCategory.JOGOS,
      published_at: new Date(BASE),
      visibility: VideoVisibility.PUBLIC,
    });
  });

  async function persistVideo(overrides: Partial<Video>): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `sug${++suggestionCounter}`,
        channel_id: channelId,
        title: 'Vídeo',
        status: VideoStatus.READY,
        category: VideoCategory.EDUCACAO,
        storage_bucket: 'videos',
        ...overrides,
      }),
    );
  }

  it('never returns the reference video, a draft, an unlisted one or another category', async () => {
    const page = await videosService.listSuggestions(reference, 0, 50);
    const ids = page.items.map((item) => item.publicId);

    expect(ids).not.toContain(reference.public_id);
    expect(ids).not.toContain(draft.public_id);
    expect(ids).not.toContain(unlisted.public_id);
    expect(ids).not.toContain(otherCategory.public_id);
    expect(ids.sort()).toEqual(
      eligibleNewestFirst.map((video) => video.public_id).sort(),
    );
    expect(page.total).toBe(3);
  }, 30000);

  it('orders the items by published_at descending', async () => {
    const page = await videosService.listSuggestions(reference, 0, 50);

    expect(page.items.map((item) => item.publicId)).toEqual(
      eligibleNewestFirst.map((video) => video.public_id),
    );
  }, 30000);
});

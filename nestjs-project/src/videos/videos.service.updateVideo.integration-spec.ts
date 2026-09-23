import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { Channel } from '../channels/entities/channel.entity';
import { ChannelsService } from '../channels/channels.service';
import storageConfig from '../config/storage.config';
import { StorageModule } from '../storage/storage.module';
import { StorageService } from '../storage/storage.service';
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

const ALL_ENTITIES = [User, Channel, RefreshToken, VerificationToken, Video];

// Persistência real: o repositório em memória do teste unitário não prova que
// as colunas da Fase 04 chegam ao banco, nem que a thumbnail vai para o MinIO.
describe('VideosService.updateVideo (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;
  let storageService: StorageService;
  let videoRepository: Repository<Video>;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;
  let bucket: string;
  let channelId: string;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
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
        { provide: ChannelsService, useValue: { findByUserId: jest.fn() } },
      ],
    }).compile();
    await module.init();

    videosService = module.get(VideosService);
    storageService = module.get(StorageService);
    bucket = storageConfig().minioBucket;
  }, 60000);

  afterAll(async () => {
    await dataSource.destroy();
  });

  let counter = 0;
  beforeEach(async () => {
    await cleanAllTables(dataSource);

    const user = await userRepository.save(
      userRepository.create({
        email: `update_video_${++counter}@example.com`,
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Canal',
        nickname: `canal_update_${counter}`,
        user_id: user.id,
      }),
    );
    channelId = channel.id;
  });

  async function createVideo(overrides: Partial<Video> = {}): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `upd${++counter}`,
        channel_id: channelId,
        title: 'Título original',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        ...overrides,
      }),
    );
  }

  it('persists category, visibility and the published timestamp', async () => {
    const video = await createVideo();

    await videosService.updateVideo(video, {
      title: 'Título editado',
      description: 'Nova descrição',
      category: VideoCategory.EDUCACAO,
      visibility: VideoVisibility.UNLISTED,
      published: true,
    });

    const stored = await videoRepository.findOneByOrFail({ id: video.id });

    expect(stored.title).toBe('Título editado');
    expect(stored.description).toBe('Nova descrição');
    expect(stored.category).toBe(VideoCategory.EDUCACAO);
    expect(stored.visibility).toBe(VideoVisibility.UNLISTED);
    expect(stored.published_at).toBeInstanceOf(Date);
  }, 30000);

  it('persists an empty description as null', async () => {
    const video = await createVideo({ description: 'Tinha descrição' });

    await videosService.updateVideo(video, { description: '' });

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.description).toBeNull();
  }, 30000);

  it('unpublishes by clearing published_at in the database', async () => {
    const video = await createVideo({ published_at: new Date() });

    await videosService.updateVideo(video, { published: false });

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.published_at).toBeNull();
  }, 30000);

  it('uploads the thumbnail to storage and keeps thumbnail_key untouched', async () => {
    const video = await createVideo({ thumbnail_key: 'auto/generated.jpg' });

    const updated = await videosService.updateVideo(video, {}, {
      buffer: Buffer.from('conteudo-da-thumb'),
      mimetype: 'image/png',
    } as Express.Multer.File);

    const stored = await videoRepository.findOneByOrFail({ id: video.id });
    expect(stored.thumbnail_key).toBe('auto/generated.jpg');
    expect(stored.custom_thumbnail_key).toBe(updated.custom_thumbnail_key);

    // O objeto existe mesmo no MinIO e serve o conteúdo enviado.
    const url = await storageService.getPresignedUrl(
      bucket,
      stored.custom_thumbnail_key as string,
    );
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('conteudo-da-thumb');
  }, 30000);

  describe('listByChannel', () => {
    it('returns the channel videos newest first, drafts included', async () => {
      // created_at é gerado pelo banco; salvar em sequência garante a ordem.
      const first = await createVideo({ title: 'Mais antigo' });
      const second = await createVideo({
        title: 'Publicado',
        published_at: new Date(),
      });
      const third = await createVideo({ title: 'Mais recente' });

      const { items, total } = await videosService.listByChannel(
        channelId,
        0,
        10,
      );

      expect(total).toBe(3);
      expect(items.map((video) => video.id)).toEqual([
        third.id,
        second.id,
        first.id,
      ]);
      // O rascunho (published_at nulo) aparece na lista do painel.
      expect(items.some((video) => video.published_at === null)).toBe(true);
    }, 30000);

    it('slices with offset and limit while total stays the channel total', async () => {
      for (let i = 0; i < 5; i++) {
        await createVideo({ title: `Vídeo ${i}` });
      }

      const firstPage = await videosService.listByChannel(channelId, 0, 2);
      const secondPage = await videosService.listByChannel(channelId, 2, 2);
      const lastPage = await videosService.listByChannel(channelId, 4, 2);

      expect(firstPage.items).toHaveLength(2);
      expect(secondPage.items).toHaveLength(2);
      expect(lastPage.items).toHaveLength(1);
      expect(firstPage.total).toBe(5);
      expect(lastPage.total).toBe(5);

      const ids = [
        ...firstPage.items,
        ...secondPage.items,
        ...lastPage.items,
      ].map((video) => video.id);
      expect(new Set(ids).size).toBe(5);
    }, 30000);

    it('never returns videos from another channel', async () => {
      await createVideo({ title: 'Do dono' });

      const otherUser = await userRepository.save(
        userRepository.create({
          email: `other_channel_${++counter}@example.com`,
          password: 'hashed',
        }),
      );
      const otherChannel = await channelRepository.save(
        channelRepository.create({
          name: 'Outro canal',
          nickname: `outro_canal_${counter}`,
          user_id: otherUser.id,
        }),
      );
      await videoRepository.save(
        videoRepository.create({
          public_id: `oth${++counter}`,
          channel_id: otherChannel.id,
          title: 'De outro canal',
          status: VideoStatus.READY,
          storage_bucket: bucket,
        }),
      );

      const { items, total } = await videosService.listByChannel(
        channelId,
        0,
        10,
      );

      expect(total).toBe(1);
      expect(items[0].title).toBe('Do dono');
    }, 30000);

    it('returns an empty list for a channel with no videos', async () => {
      const { items, total } = await videosService.listByChannel(
        channelId,
        0,
        10,
      );

      expect(items).toEqual([]);
      expect(total).toBe(0);
    }, 30000);
  });

  describe('listPublicByChannel / countPublicByChannel', () => {
    async function seedMixedVideos() {
      // Publicados e públicos: os únicos que a página pública mostra.
      const older = await createVideo({
        title: 'Público antigo',
        published_at: new Date('2026-07-01T12:00:00.000Z'),
      });
      const newer = await createVideo({
        title: 'Público recente',
        published_at: new Date('2026-07-28T12:00:00.000Z'),
      });
      // Fora da vitrine: rascunho e "Indisponível" (unlisted).
      await createVideo({ title: 'Rascunho' });
      await createVideo({
        title: 'Indisponível',
        visibility: VideoVisibility.UNLISTED,
        published_at: new Date('2026-07-30T12:00:00.000Z'),
      });
      return { older, newer };
    }

    it('returns only published public videos, newest published first', async () => {
      const { older, newer } = await seedMixedVideos();

      const { items, total } = await videosService.listPublicByChannel(
        channelId,
        0,
        8,
      );

      expect(total).toBe(2);
      expect(items.map((video) => video.id)).toEqual([newer.id, older.id]);
      expect(items.every((video) => video.published_at !== null)).toBe(true);
      expect(
        items.every((video) => video.visibility === VideoVisibility.PUBLIC),
      ).toBe(true);
    }, 30000);

    it('counts with the same criteria used by the listing', async () => {
      await seedMixedVideos();

      const count = await videosService.countPublicByChannel(channelId);
      const { total } = await videosService.listPublicByChannel(
        channelId,
        0,
        8,
      );

      // O contador do cabeçalho não pode divergir da vitrine.
      expect(count).toBe(2);
      expect(count).toBe(total);
    }, 30000);

    it('slices with offset and limit while total stays the public total', async () => {
      for (let i = 0; i < 5; i++) {
        await createVideo({
          title: `Público ${i}`,
          published_at: new Date(Date.UTC(2026, 6, i + 1)),
        });
      }

      const firstPage = await videosService.listPublicByChannel(
        channelId,
        0,
        2,
      );
      const lastPage = await videosService.listPublicByChannel(channelId, 4, 2);

      expect(firstPage.items).toHaveLength(2);
      expect(lastPage.items).toHaveLength(1);
      expect(firstPage.total).toBe(5);
      expect(lastPage.total).toBe(5);
    }, 30000);

    it('returns nothing for a channel with no published public videos', async () => {
      await createVideo({ title: 'Só rascunho' });

      const { items, total } = await videosService.listPublicByChannel(
        channelId,
        0,
        8,
      );

      expect(items).toEqual([]);
      expect(total).toBe(0);
      expect(await videosService.countPublicByChannel(channelId)).toBe(0);
    }, 30000);
  });
});

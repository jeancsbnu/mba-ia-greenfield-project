import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
import storageConfig from '../config/storage.config';
import { ReactionsService } from '../reactions/reactions.service';
import { StorageModule } from '../storage/storage.module';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
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

const ENTITIES = [User, Channel, RefreshToken, VerificationToken, Video];
const DAY = 86_400_000;
const BASE = Date.UTC(2026, 9, 1, 12, 0, 0);

// Listagem global (home-busca/TD-01, TD-03, TD-04, TD-05) contra o banco real:
// a busca depende de immutable_unaccent e do escape do LIKE, que só o
// Postgres prova.
describe('VideosService.listFeed (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;
  let videoRepository: Repository<Video>;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ENTITIES);
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
        { provide: ReactionsService, useValue: {} },
        { provide: SubscriptionsService, useValue: {} },
        { provide: getRepositoryToken(Video), useValue: videoRepository },
        { provide: ChannelsService, useValue: {} },
      ],
    }).compile();
    await module.init();
    videosService = module.get(VideosService);
  }, 60000);

  afterAll(async () => {
    await dataSource.destroy();
  });

  let counter = 0;

  async function createChannel(name: string, nickname: string) {
    const user = await userRepository.save(
      userRepository.create({
        email: `feed_${++counter}@example.com`,
        password: 'hashed',
      }),
    );
    return channelRepository.save(
      channelRepository.create({
        name,
        nickname: `${nickname}_${counter}`,
        user_id: user.id,
      }),
    );
  }

  async function persistVideo(
    channel: Channel,
    overrides: Partial<Video>,
  ): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `feed${++counter}`,
        channel_id: channel.id,
        title: 'Vídeo',
        status: VideoStatus.READY,
        category: VideoCategory.OUTROS,
        visibility: VideoVisibility.PUBLIC,
        storage_bucket: 'videos',
        ...overrides,
      }),
    );
  }

  function publishedAt(daysAgo: number): Date {
    return new Date(BASE - daysAgo * DAY);
  }

  let general: Channel;
  let musicChannel: Channel;
  let liveMusic: Video;
  let cakeOnMusicChannel: Video;
  let sqlClass: Video;
  let draft: Video;
  let unlisted: Video;

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    general = await createChannel('Canal Geral', 'geral');
    musicChannel = await createChannel('Música Boa', 'mboa');

    sqlClass = await persistVideo(general, {
      title: 'Aula de SQL',
      category: VideoCategory.EDUCACAO,
      published_at: publishedAt(0),
    });
    liveMusic = await persistVideo(general, {
      title: 'Música ao vivo',
      category: VideoCategory.MUSICA,
      published_at: publishedAt(1),
    });
    cakeOnMusicChannel = await persistVideo(musicChannel, {
      title: 'Receita de bolo',
      category: VideoCategory.OUTROS,
      published_at: publishedAt(2),
    });
    draft = await persistVideo(general, {
      title: 'Música em rascunho',
      category: VideoCategory.MUSICA,
      published_at: null,
    });
    unlisted = await persistVideo(general, {
      title: 'Música fora da lista',
      category: VideoCategory.MUSICA,
      visibility: VideoVisibility.UNLISTED,
      published_at: publishedAt(0),
    });
  });

  function ids(page: { items: { publicId: string }[] }): string[] {
    return page.items.map((item) => item.publicId);
  }

  it('lists only published public videos, newest first, crediting the channel', async () => {
    const page = await videosService.listFeed({ offset: 0, limit: 12 });

    expect(ids(page)).toEqual([
      sqlClass.public_id,
      liveMusic.public_id,
      cakeOnMusicChannel.public_id,
    ]);
    expect(page.total).toBe(3);
    expect(page.items[2].channel).toEqual({
      nickname: musicChannel.nickname,
      name: 'Música Boa',
    });
  });

  it('breaks a published_at tie by id descending', async () => {
    const tieA = await persistVideo(general, { published_at: publishedAt(5) });
    const tieB = await persistVideo(general, { published_at: publishedAt(5) });

    const page = await videosService.listFeed({ offset: 3, limit: 12 });

    expect(ids(page)).toEqual(
      [tieA, tieB]
        .sort((a, b) => (a.id < b.id ? 1 : -1))
        .map((video) => video.public_id),
    );
  });

  it('filters by category', async () => {
    const page = await videosService.listFeed({
      category: VideoCategory.MUSICA,
      offset: 0,
      limit: 12,
    });

    expect(ids(page)).toEqual([liveMusic.public_id]);
    expect(page.total).toBe(1);
  });

  it('matches the title or the channel name ignoring case and accents', async () => {
    const page = await videosService.listFeed({
      q: 'musica',
      offset: 0,
      limit: 12,
    });

    expect(ids(page)).toEqual([
      liveMusic.public_id,
      cakeOnMusicChannel.public_id,
    ]);
  });

  it('matches the channel nickname and brings every video of that channel', async () => {
    const dockerChannel = await createChannel('Outro Nome', 'docker_br');
    const first = await persistVideo(dockerChannel, {
      title: 'Primeiro',
      published_at: publishedAt(3),
    });
    const second = await persistVideo(dockerChannel, {
      title: 'Segundo',
      published_at: publishedAt(4),
    });

    const page = await videosService.listFeed({
      q: 'docker',
      offset: 0,
      limit: 12,
    });

    expect(ids(page)).toEqual([first.public_id, second.public_id]);
  });

  it('treats an underscore in the term as a literal character', async () => {
    const literal = await persistVideo(general, {
      title: 'Variável a_b na prática',
      published_at: publishedAt(3),
    });
    await persistVideo(general, {
      title: 'Variável aXb na prática',
      published_at: publishedAt(3),
    });

    const page = await videosService.listFeed({
      q: 'a_b',
      offset: 0,
      limit: 12,
    });

    expect(ids(page)).toEqual([literal.public_id]);
  });

  it('never returns a draft or an unlisted video, with or without filters', async () => {
    const pages = await Promise.all([
      videosService.listFeed({ offset: 0, limit: 50 }),
      videosService.listFeed({ q: 'musica', offset: 0, limit: 50 }),
      videosService.listFeed({
        category: VideoCategory.MUSICA,
        offset: 0,
        limit: 50,
      }),
      videosService.listFeed({
        q: 'musica',
        category: VideoCategory.MUSICA,
        offset: 0,
        limit: 50,
      }),
    ]);

    for (const page of pages) {
      expect(ids(page)).not.toContain(draft.public_id);
      expect(ids(page)).not.toContain(unlisted.public_id);
    }
  });

  it('reports the total of matches regardless of the page', async () => {
    const page = await videosService.listFeed({ offset: 1, limit: 1 });

    expect(ids(page)).toEqual([liveMusic.public_id]);
    expect(page.total).toBe(3);
  });

  it('returns an empty page without error when nothing matches', async () => {
    const page = await videosService.listFeed({
      q: 'xyzabc',
      offset: 0,
      limit: 12,
    });

    expect(page).toEqual({ items: [], total: 0 });
  });
});

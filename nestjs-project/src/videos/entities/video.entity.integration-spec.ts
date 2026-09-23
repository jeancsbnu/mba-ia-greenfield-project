import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { User } from '../../users/entities/user.entity';
import {
  Video,
  VideoCategory,
  VideoStatus,
  VideoVisibility,
} from './video.entity';

const ALL_ENTITIES = [User, Channel, Video];

describe('Video entity (integration)', () => {
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let channelRepository: Repository<Channel>;
  let videoRepository: Repository<Video>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    userRepository = dataSource.getRepository(User);
    channelRepository = dataSource.getRepository(Channel);
    videoRepository = dataSource.getRepository(Video);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
  });

  let userCounter = 0;
  async function createChannel(): Promise<Channel> {
    const user = await userRepository.save(
      userRepository.create({
        email: `video_user_${++userCounter}@example.com`,
        password: 'hashed',
      }),
    );
    return channelRepository.save(
      channelRepository.create({
        name: 'Channel',
        nickname: `chan_${userCounter}`,
        user_id: user.id,
      }),
    );
  }

  // Helper da Fase 04: cria um canal próprio e devolve os campos mínimos do vídeo.
  let videoCounter = 0;
  async function buildVideo(
    overrides: Partial<Video> = {},
  ): Promise<Partial<Video>> {
    const channel = await createChannel();
    return {
      public_id: `f04_${++videoCounter}`,
      channel_id: channel.id,
      title: 'Vídeo da Fase 04',
      ...overrides,
    };
  }

  it('should enforce unique public_id constraint', async () => {
    const channel1 = await createChannel();
    const channel2 = await createChannel();

    await videoRepository.save(
      videoRepository.create({
        public_id: 'abc1234567',
        channel_id: channel1.id,
        title: 'Video One',
      }),
    );

    await expect(
      videoRepository.save(
        videoRepository.create({
          public_id: 'abc1234567',
          channel_id: channel2.id,
          title: 'Video Two',
        }),
      ),
    ).rejects.toThrow();
  });

  it('should default status to draft when omitted', async () => {
    const channel = await createChannel();

    const video = await videoRepository.save(
      videoRepository.create({
        public_id: 'defstatus1',
        channel_id: channel.id,
        title: 'Draft Video',
      }),
    );

    expect(video.status).toBe(VideoStatus.DRAFT);
  });

  it('should load the related channel via the ManyToOne relation', async () => {
    const channel = await createChannel();
    await videoRepository.save(
      videoRepository.create({
        public_id: 'relvideo01',
        channel_id: channel.id,
        title: 'Related Video',
      }),
    );

    const found = await videoRepository.findOne({
      where: { public_id: 'relvideo01' },
      relations: ['channel'],
    });

    expect(found?.channel.id).toBe(channel.id);
  });

  describe('Fase 04 defaults', () => {
    it('defaults category to Outros, visibility to public and counters to zero', async () => {
      const saved = await videoRepository.save(
        videoRepository.create(await buildVideo()),
      );

      const found = await videoRepository.findOneByOrFail({ id: saved.id });

      expect(found.category).toBe(VideoCategory.OUTROS);
      expect(found.visibility).toBe(VideoVisibility.PUBLIC);
      expect(found.views_count).toBe(0);
      expect(found.likes_count).toBe(0);
      expect(found.comments_count).toBe(0);
    });

    it('leaves published_at null — a new video is a draft (TD-02)', async () => {
      const saved = await videoRepository.save(
        videoRepository.create(await buildVideo()),
      );

      const found = await videoRepository.findOneByOrFail({ id: saved.id });

      expect(found.published_at).toBeNull();
    });

    it('leaves custom_thumbnail_key null until the owner uploads one (TD-04)', async () => {
      const saved = await videoRepository.save(
        videoRepository.create(
          await buildVideo({ thumbnail_key: 'auto/key.jpg' }),
        ),
      );

      const found = await videoRepository.findOneByOrFail({ id: saved.id });

      expect(found.custom_thumbnail_key).toBeNull();
      expect(found.thumbnail_key).toBe('auto/key.jpg');
    });
  });

  describe('Fase 04 persistence', () => {
    it('stores every category value decided in TD-10', async () => {
      const categories = Object.values(VideoCategory);

      for (const category of categories) {
        const saved = await videoRepository.save(
          videoRepository.create(await buildVideo({ category })),
        );
        const found = await videoRepository.findOneByOrFail({ id: saved.id });
        expect(found.category).toBe(category);
      }

      expect(categories).toHaveLength(8);
    });

    it('stores unlisted visibility and a publication timestamp', async () => {
      const publishedAt = new Date('2026-07-28T12:00:00.000Z');

      const saved = await videoRepository.save(
        videoRepository.create(
          await buildVideo({
            visibility: VideoVisibility.UNLISTED,
            published_at: publishedAt,
          }),
        ),
      );

      const found = await videoRepository.findOneByOrFail({ id: saved.id });

      expect(found.visibility).toBe(VideoVisibility.UNLISTED);
      expect(found.published_at).toEqual(publishedAt);
    });

    it('stores the custom thumbnail key alongside the worker-generated one', async () => {
      const saved = await videoRepository.save(
        videoRepository.create(
          await buildVideo({
            thumbnail_key: 'auto/key.jpg',
            custom_thumbnail_key: 'custom/key.png',
          }),
        ),
      );

      const found = await videoRepository.findOneByOrFail({ id: saved.id });

      expect(found.thumbnail_key).toBe('auto/key.jpg');
      expect(found.custom_thumbnail_key).toBe('custom/key.png');
    });
  });

  describe('Fase 04 enum constraints', () => {
    it('rejects a category outside the TD-10 list', async () => {
      await expect(
        dataSource.query(
          `INSERT INTO "videos" ("public_id", "channel_id", "title", "category")
           VALUES ($1, $2, $3, $4)`,
          [
            'vid_bad_cat',
            (await createChannel()).id,
            'Categoria inválida',
            'Tutoriais',
          ],
        ),
      ).rejects.toBeInstanceOf(QueryFailedError);
    });

    it('rejects a visibility outside public/unlisted', async () => {
      await expect(
        dataSource.query(
          `INSERT INTO "videos" ("public_id", "channel_id", "title", "visibility")
           VALUES ($1, $2, $3, $4)`,
          [
            'vid_bad_vis',
            (await createChannel()).id,
            'Visibilidade inválida',
            'private',
          ],
        ),
      ).rejects.toBeInstanceOf(QueryFailedError);
    });
  });
});

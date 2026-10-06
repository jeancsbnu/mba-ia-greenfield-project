import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
import type { ReactionsService } from '../reactions/reactions.service';
import type { StorageService } from '../storage/storage.service';
import type { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../test/social-fixtures';
import { User } from '../users/entities/user.entity';
import { Video, VideoVisibility } from './entities/video.entity';
import { VideosService } from './videos.service';

const ALL_ENTITIES = [User, Channel, RefreshToken, VerificationToken, Video];

// Contagem de vídeos públicos por canal para a área de canais seguidos
// (SI-06.12): uma query agrupada, mesma regra de countPublicByChannel.
describe('VideosService.countPublicByChannels (integration)', () => {
  let dataSource: DataSource;
  let videosService: VideosService;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    videosService = new VideosService(
      dataSource.getRepository(Video),
      new ChannelsService(dataSource),
      {} as StorageService,
      {} as ReactionsService,
      {} as SubscriptionsService,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('counts only published public videos and gives 0 to a channel without videos', async () => {
    const busy = await createUserWithChannel(dataSource);
    const empty = await createUserWithChannel(dataSource);
    await createVideo(dataSource, busy.channel.id, {
      published_at: new Date(),
    });
    await createVideo(dataSource, busy.channel.id, {
      published_at: new Date(),
    });
    await createVideo(dataSource, busy.channel.id, {
      published_at: new Date(),
      visibility: VideoVisibility.UNLISTED,
    });
    await createVideo(dataSource, busy.channel.id, { published_at: null });

    const counts = await videosService.countPublicByChannels([
      busy.channel.id,
      empty.channel.id,
    ]);

    expect(counts.get(busy.channel.id)).toBe(2);
    expect(counts.get(empty.channel.id)).toBe(0);
  });

  it('runs a single query for many channels', async () => {
    const channels: string[] = [];
    for (let i = 0; i < 4; i++) {
      const { channel } = await createUserWithChannel(dataSource);
      await createVideo(dataSource, channel.id, { published_at: new Date() });
      channels.push(channel.id);
    }
    const querySpy = jest.spyOn(dataSource.driver, 'createQueryRunner');

    await videosService.countPublicByChannels(channels);

    expect(querySpy).toHaveBeenCalledTimes(1);
  });

  it('returns an empty map without querying for an empty list', async () => {
    const querySpy = jest.spyOn(dataSource.driver, 'createQueryRunner');

    const counts = await videosService.countPublicByChannels([]);

    expect(counts.size).toBe(0);
    expect(querySpy).not.toHaveBeenCalled();
  });
});

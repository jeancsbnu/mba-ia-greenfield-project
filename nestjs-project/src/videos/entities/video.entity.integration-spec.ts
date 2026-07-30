import { DataSource, Repository } from 'typeorm';
import { Channel } from '../../channels/entities/channel.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { User } from '../../users/entities/user.entity';
import { Video, VideoStatus } from './video.entity';

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
});

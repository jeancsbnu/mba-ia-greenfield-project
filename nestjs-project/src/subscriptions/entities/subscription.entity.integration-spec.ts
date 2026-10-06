import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';
import { Channel } from '../../channels/entities/channel.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { createUserWithChannel } from '../../test/social-fixtures';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import { Subscription } from './subscription.entity';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Subscription,
];

describe('Subscription entity (integration)', () => {
  let dataSource: DataSource;
  let subscriptions: Repository<Subscription>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    subscriptions = dataSource.getRepository(Subscription);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "subscriptions"');
    await cleanAllTables(dataSource);
  });

  it('rejects a duplicate subscription for the same user and channel', async () => {
    const follower = await createUserWithChannel(dataSource);
    const owner = await createUserWithChannel(dataSource);
    await subscriptions.insert({
      user_id: follower.user.id,
      channel_id: owner.channel.id,
    });

    await expect(
      subscriptions.insert({
        user_id: follower.user.id,
        channel_id: owner.channel.id,
      }),
    ).rejects.toThrow();
  });

  it('removes the subscriptions when the channel is deleted', async () => {
    const follower = await createUserWithChannel(dataSource);
    const owner = await createUserWithChannel(dataSource);
    await subscriptions.insert({
      user_id: follower.user.id,
      channel_id: owner.channel.id,
    });

    await dataSource.getRepository(Channel).delete({ id: owner.channel.id });

    expect(await subscriptions.count()).toBe(0);
  });

  it('removes the subscriptions when the follower is deleted', async () => {
    const follower = await createUserWithChannel(dataSource);
    const owner = await createUserWithChannel(dataSource);
    await subscriptions.insert({
      user_id: follower.user.id,
      channel_id: owner.channel.id,
    });

    await dataSource.getRepository(Channel).delete({ id: follower.channel.id });
    await dataSource.getRepository(User).delete({ id: follower.user.id });

    expect(await subscriptions.count()).toBe(0);
  });
});

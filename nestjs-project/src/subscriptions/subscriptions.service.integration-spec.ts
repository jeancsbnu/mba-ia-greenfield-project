import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { createUserWithChannel } from '../test/social-fixtures';
import { User } from '../users/entities/user.entity';
import { Video } from '../videos/entities/video.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Subscription,
];

describe('SubscriptionsService (integration)', () => {
  let dataSource: DataSource;
  let channelsService: ChannelsService;
  let service: SubscriptionsService;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    channelsService = new ChannelsService(dataSource);
    service = new SubscriptionsService(dataSource, channelsService);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "subscriptions"');
    await cleanAllTables(dataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function countOnDb(channelId: string): Promise<number> {
    const channel = await dataSource
      .getRepository(Channel)
      .findOneByOrFail({ id: channelId });
    return channel.subscribers_count;
  }

  describe('subscribe / unsubscribe', () => {
    it('adds one subscriber and reports the new count', async () => {
      const follower = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);

      const state = await service.subscribe(follower.user.id, owner.channel);

      expect(state).toEqual({ subscribed: true, subscribersCount: 1 });
      expect(await countOnDb(owner.channel.id)).toBe(1);
    });

    it('does not add again when the subscription already exists', async () => {
      const follower = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);
      await service.subscribe(follower.user.id, owner.channel);

      const state = await service.subscribe(follower.user.id, owner.channel);

      expect(state.subscribersCount).toBe(1);
      expect(await dataSource.getRepository(Subscription).count()).toBe(1);
    });

    it('subtracts one when unsubscribing', async () => {
      const follower = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);
      await service.subscribe(follower.user.id, owner.channel);

      const state = await service.unsubscribe(follower.user.id, owner.channel);

      expect(state).toEqual({ subscribed: false, subscribersCount: 0 });
    });

    it('does not subtract when there is no subscription to remove', async () => {
      const follower = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);

      const state = await service.unsubscribe(follower.user.id, owner.channel);

      expect(state.subscribersCount).toBe(0);
      expect(await countOnDb(owner.channel.id)).toBe(0);
    });

    it('rolls back the subscription when the counter update fails', async () => {
      const follower = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);
      jest
        .spyOn(channelsService, 'adjustSubscribersCount')
        .mockRejectedValueOnce(new Error('counter update failed'));

      await expect(
        service.subscribe(follower.user.id, owner.channel),
      ).rejects.toThrow('counter update failed');

      expect(await dataSource.getRepository(Subscription).count()).toBe(0);
      expect(await countOnDb(owner.channel.id)).toBe(0);
    });
  });
  describe('isSubscribed', () => {
    it('is true only for the subscribed pair', async () => {
      const follower = await createUserWithChannel(dataSource);
      const other = await createUserWithChannel(dataSource);
      const owner = await createUserWithChannel(dataSource);
      await service.subscribe(follower.user.id, owner.channel);

      expect(
        await service.isSubscribed(follower.user.id, owner.channel.id),
      ).toBe(true);
      expect(await service.isSubscribed(other.user.id, owner.channel.id)).toBe(
        false,
      );
    });
  });

  describe('listByUser', () => {
    it('lists only the user channels, most recent subscription first, with total', async () => {
      const follower = await createUserWithChannel(dataSource);
      const other = await createUserWithChannel(dataSource);
      const first = await createUserWithChannel(dataSource);
      const second = await createUserWithChannel(dataSource);
      const third = await createUserWithChannel(dataSource);
      for (const [index, owner] of [first, second, third].entries()) {
        await service.subscribe(follower.user.id, owner.channel);
        await dataSource.query(
          `UPDATE subscriptions SET created_at = now() - ($1 || ' minutes')::interval
            WHERE user_id = $2 AND channel_id = $3`,
          [30 - index * 10, follower.user.id, owner.channel.id],
        );
      }
      await service.subscribe(other.user.id, first.channel);

      const result = await service.listByUser(follower.user.id, 0, 50);

      expect(result.total).toBe(3);
      expect(result.items.map((c) => c.id)).toEqual([
        third.channel.id,
        second.channel.id,
        first.channel.id,
      ]);
    });

    it('paginates with offset/limit', async () => {
      const follower = await createUserWithChannel(dataSource);
      for (let i = 0; i < 3; i++) {
        const owner = await createUserWithChannel(dataSource);
        await service.subscribe(follower.user.id, owner.channel);
      }

      const page = await service.listByUser(follower.user.id, 1, 1);

      expect(page.total).toBe(3);
      expect(page.items).toHaveLength(1);
    });
  });
});

import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CommentReaction } from '../reactions/entities/comment-reaction.entity';
import { VideoReaction } from '../reactions/entities/video-reaction.entity';
import { ReactionType } from '../reactions/reaction-type.enum';
import { ReactionsService } from '../reactions/reactions.service';
import type { StorageService } from '../storage/storage.service';
import type { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../test/social-fixtures';
import { User } from '../users/entities/user.entity';
import { Video } from './entities/video.entity';
import { VideosService } from './videos.service';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Comment,
  VideoReaction,
  CommentReaction,
];

// Contador de likes mantido na mesma transação da reação
// (social-interactions/TD-02), contra o banco real.
describe('VideosService.setReaction (integration)', () => {
  let dataSource: DataSource;
  let reactionsService: ReactionsService;
  let videosService: VideosService;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    reactionsService = new ReactionsService(
      dataSource.getRepository(VideoReaction),
      dataSource.getRepository(CommentReaction),
    );
    videosService = new VideosService(
      dataSource.getRepository(Video),
      new ChannelsService(dataSource),
      {} as StorageService,
      reactionsService,
      {} as SubscriptionsService,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "video_reactions"');
    await cleanAllTables(dataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function likesOnDb(id: string): Promise<number> {
    return (await dataSource.getRepository(Video).findOneByOrFail({ id }))
      .likes_count;
  }

  it('returns to zero after none → like → dislike → none', async () => {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);

    const liked = await videosService.setReaction(
      video,
      user.id,
      ReactionType.LIKE,
    );
    expect(liked).toEqual({ viewerReaction: ReactionType.LIKE, likesCount: 1 });

    const disliked = await videosService.setReaction(
      video,
      user.id,
      ReactionType.DISLIKE,
    );
    expect(disliked.likesCount).toBe(0);

    const removed = await videosService.setReaction(video, user.id, null);
    expect(removed).toEqual({ viewerReaction: null, likesCount: 0 });
    expect(await likesOnDb(video.id)).toBe(0);
  });

  it('does not add again when the same like repeats', async () => {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);

    await videosService.setReaction(video, user.id, ReactionType.LIKE);
    const again = await videosService.setReaction(
      video,
      user.id,
      ReactionType.LIKE,
    );

    expect(again.likesCount).toBe(1);
    expect(await likesOnDb(video.id)).toBe(1);
  });

  it('counts likes from different users independently', async () => {
    const owner = await createUserWithChannel(dataSource);
    const viewer = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, owner.channel.id);

    await videosService.setReaction(video, owner.user.id, ReactionType.LIKE);
    const second = await videosService.setReaction(
      video,
      viewer.user.id,
      ReactionType.LIKE,
    );

    expect(second.likesCount).toBe(2);
  });

  it('leaves no reaction and no counter drift when the transaction fails', async () => {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);
    jest
      .spyOn(reactionsService, 'applyVideoReaction')
      .mockImplementationOnce(async (manager, videoId, userId, next) => {
        await manager.insert(VideoReaction, {
          user_id: userId,
          video_id: videoId,
          type: next ?? ReactionType.LIKE,
        });
        throw new Error('failure after writing the reaction');
      });

    await expect(
      videosService.setReaction(video, user.id, ReactionType.LIKE),
    ).rejects.toThrow('failure after writing the reaction');

    expect(await dataSource.getRepository(VideoReaction).count()).toBe(0);
    expect(await likesOnDb(video.id)).toBe(0);
  });
});

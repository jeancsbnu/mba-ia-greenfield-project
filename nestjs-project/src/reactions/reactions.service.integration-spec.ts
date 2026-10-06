import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { Channel } from '../channels/entities/channel.entity';
import { Comment } from '../comments/entities/comment.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../test/social-fixtures';
import { User } from '../users/entities/user.entity';
import { Video } from '../videos/entities/video.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { VideoReaction } from './entities/video-reaction.entity';
import { ReactionType } from './reaction-type.enum';
import { ReactionsService } from './reactions.service';

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

describe('ReactionsService (integration)', () => {
  let dataSource: DataSource;
  let service: ReactionsService;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    service = new ReactionsService(
      dataSource.getRepository(VideoReaction),
      dataSource.getRepository(CommentReaction),
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "comment_reactions"');
    await dataSource.query('DELETE FROM "video_reactions"');
    await dataSource.query('DELETE FROM "comments"');
    await cleanAllTables(dataSource);
  });

  async function setup() {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);
    return { user, video };
  }

  function applyVideo(
    videoId: string,
    userId: string,
    next: ReactionType | null,
  ): Promise<ReactionType | null> {
    return dataSource.transaction((manager) =>
      service.applyVideoReaction(manager, videoId, userId, next),
    );
  }

  describe('applyVideoReaction', () => {
    it('records a new reaction and reports no previous one', async () => {
      const { user, video } = await setup();

      const previous = await applyVideo(video.id, user.id, ReactionType.LIKE);

      expect(previous).toBeNull();
      expect(await service.findVideoReaction(video.id, user.id)).toBe(
        ReactionType.LIKE,
      );
    });

    it('switches like to dislike in place and reports the like', async () => {
      const { user, video } = await setup();
      await applyVideo(video.id, user.id, ReactionType.LIKE);

      const previous = await applyVideo(
        video.id,
        user.id,
        ReactionType.DISLIKE,
      );

      expect(previous).toBe(ReactionType.LIKE);
      const rows = await dataSource
        .getRepository(VideoReaction)
        .find({ where: { video_id: video.id } });
      expect(rows).toHaveLength(1);
      expect(rows[0].type).toBe(ReactionType.DISLIKE);
    });

    it('removes the reaction when next is null and reports the old one', async () => {
      const { user, video } = await setup();
      await applyVideo(video.id, user.id, ReactionType.LIKE);

      const previous = await applyVideo(video.id, user.id, null);

      expect(previous).toBe(ReactionType.LIKE);
      expect(await service.findVideoReaction(video.id, user.id)).toBeNull();
    });

    it('treats removing a missing reaction as a no-op', async () => {
      const { user, video } = await setup();

      const previous = await applyVideo(video.id, user.id, null);

      expect(previous).toBeNull();
      expect(await dataSource.getRepository(VideoReaction).count()).toBe(0);
    });

    it('does not create a second row when the same reaction repeats', async () => {
      const { user, video } = await setup();
      await applyVideo(video.id, user.id, ReactionType.LIKE);

      const previous = await applyVideo(video.id, user.id, ReactionType.LIKE);

      expect(previous).toBe(ReactionType.LIKE);
      expect(await dataSource.getRepository(VideoReaction).count()).toBe(1);
    });
  });

  describe('applyCommentReaction + findCommentReactions', () => {
    it('returns only the commented pairs of the user, in one lookup', async () => {
      const { user, video } = await setup();
      const other = await createUserWithChannel(dataSource);
      const comments = dataSource.getRepository(Comment);
      const [first, second, third] = await comments.save([
        comments.create({ video_id: video.id, user_id: user.id, body: '1' }),
        comments.create({ video_id: video.id, user_id: user.id, body: '2' }),
        comments.create({ video_id: video.id, user_id: user.id, body: '3' }),
      ]);
      await dataSource.transaction(async (manager) => {
        await service.applyCommentReaction(
          manager,
          first.id,
          user.id,
          ReactionType.LIKE,
        );
        await service.applyCommentReaction(
          manager,
          second.id,
          user.id,
          ReactionType.DISLIKE,
        );
        await service.applyCommentReaction(
          manager,
          third.id,
          other.user.id,
          ReactionType.LIKE,
        );
      });

      const reactions = await service.findCommentReactions(
        [first.id, second.id, third.id],
        user.id,
      );

      expect(reactions.get(first.id)).toBe(ReactionType.LIKE);
      expect(reactions.get(second.id)).toBe(ReactionType.DISLIKE);
      expect(reactions.has(third.id)).toBe(false);
    });

    it('returns an empty map for an empty id list', async () => {
      const { user } = await setup();
      expect((await service.findCommentReactions([], user.id)).size).toBe(0);
    });
  });
});

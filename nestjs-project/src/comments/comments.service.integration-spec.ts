import { DataSource } from 'typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { ChannelsService } from '../channels/channels.service';
import { Channel } from '../channels/entities/channel.entity';
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
import { Video } from '../videos/entities/video.entity';
import { VideosService } from '../videos/videos.service';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';

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

describe('CommentsService (integration)', () => {
  let dataSource: DataSource;
  let service: CommentsService;
  let reactionsService: ReactionsService;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    const channelsService = new ChannelsService(dataSource);
    reactionsService = new ReactionsService(
      dataSource.getRepository(VideoReaction),
      dataSource.getRepository(CommentReaction),
    );
    const videosService = new VideosService(
      dataSource.getRepository(Video),
      channelsService,
      {} as StorageService,
      reactionsService,
      {} as SubscriptionsService,
    );
    service = new CommentsService(
      dataSource.getRepository(Comment),
      videosService,
      channelsService,
      reactionsService,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "comment_reactions"');
    await dataSource.query('DELETE FROM "comments"');
    await cleanAllTables(dataSource);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function setup() {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);
    return { user, channel, video };
  }

  // created_at distintos e crescentes, para a ordenação ser determinística.
  async function seedComment(
    videoId: string,
    userId: string,
    minutesAgo: number,
    parentId: string | null = null,
  ): Promise<Comment> {
    const repository = dataSource.getRepository(Comment);
    const saved = await repository.save(
      repository.create({
        video_id: videoId,
        user_id: userId,
        parent_id: parentId,
        body: `comentário de ${minutesAgo} min`,
      }),
    );
    await dataSource.query(
      `UPDATE comments SET created_at = now() - ($1 || ' minutes')::interval WHERE id = $2`,
      [minutesAgo, saved.id],
    );
    return saved;
  }

  async function commentsCountOnDb(videoId: string): Promise<number> {
    return (
      await dataSource.getRepository(Video).findOneByOrFail({ id: videoId })
    ).comments_count;
  }

  describe('create', () => {
    it('adds one to comments_count for a root and for a reply', async () => {
      const { user, video } = await setup();

      const root = await service.create(video, user.id, 'Raiz');
      await service.create(video, user.id, 'Resposta', root.id);

      expect(await commentsCountOnDb(video.id)).toBe(2);
    });

    it('stores a reply to a reply under the original root', async () => {
      const { user, video } = await setup();
      const root = await service.create(video, user.id, 'Raiz');
      const reply = await service.create(video, user.id, 'Resposta', root.id);

      const nested = await service.create(video, user.id, 'Tréplica', reply.id);

      expect(nested.parentId).toBe(root.id);
      const parents = await dataSource.query<{ parent_id: string | null }[]>(
        'SELECT DISTINCT parent_id FROM comments WHERE parent_id IS NOT NULL',
      );
      expect(parents).toEqual([{ parent_id: root.id }]);
    });

    it('keeps comments_count when the parent belongs to another video', async () => {
      const { user, channel, video } = await setup();
      const otherVideo = await createVideo(dataSource, channel.id);
      const foreignRoot = await service.create(otherVideo, user.id, 'Outro');

      await expect(
        service.create(video, user.id, 'Oi', foreignRoot.id),
      ).rejects.toThrow('Comment not found');

      expect(await commentsCountOnDb(video.id)).toBe(0);
    });
  });

  describe('listThreads', () => {
    it('preloads the 3 most recent replies with the thread total', async () => {
      const { user, video } = await setup();
      const root = await seedComment(video.id, user.id, 100);
      for (let i = 1; i <= 7; i++) {
        await seedComment(video.id, user.id, 100 - i, root.id);
      }

      const page = await service.listThreads(video.id, 0, 10);

      expect(page.items).toHaveLength(1);
      const thread = page.items[0];
      expect(thread.repliesCount).toBe(7);
      expect(thread.replies.map((r) => r.body)).toEqual([
        'comentário de 93 min',
        'comentário de 94 min',
        'comentário de 95 min',
      ]);
    });

    it('orders roots newest first and paginates with offset/limit', async () => {
      const { user, video } = await setup();
      for (let minutes = 12; minutes >= 1; minutes--) {
        await seedComment(video.id, user.id, minutes);
      }

      const first = await service.listThreads(video.id, 0, 10);
      const second = await service.listThreads(video.id, 10, 10);

      expect(first.total).toBe(12);
      expect(first.items).toHaveLength(10);
      expect(first.items[0].body).toBe('comentário de 1 min');
      expect(second.items.map((t) => t.body)).toEqual([
        'comentário de 11 min',
        'comentário de 12 min',
      ]);
      expect(first.items[0].repliesCount).toBe(0);
      expect(first.items[0].replies).toEqual([]);
    });

    it('fills viewerReaction only when there is a viewer', async () => {
      const { user, video } = await setup();
      const root = await seedComment(video.id, user.id, 5);
      await dataSource.transaction((manager) =>
        reactionsService.applyCommentReaction(
          manager,
          root.id,
          user.id,
          ReactionType.LIKE,
        ),
      );

      const asViewer = await service.listThreads(video.id, 0, 10, user.id);
      const anonymous = await service.listThreads(video.id, 0, 10);

      expect(asViewer.items[0].viewerReaction).toBe(ReactionType.LIKE);
      expect(anonymous.items[0].viewerReaction).toBeNull();
    });

    it('runs the same number of queries for 2 roots and for 10 roots', async () => {
      const small = await setup();
      for (let i = 0; i < 2; i++) {
        const root = await seedComment(small.video.id, small.user.id, 50 + i);
        await seedComment(small.video.id, small.user.id, 10 + i, root.id);
      }
      const large = await setup();
      for (let i = 0; i < 10; i++) {
        const root = await seedComment(large.video.id, large.user.id, 50 + i);
        await seedComment(large.video.id, large.user.id, 10 + i, root.id);
      }

      const querySpy = jest.spyOn(dataSource.manager, 'query');
      await service.listThreads(small.video.id, 0, 10, small.user.id);
      const smallQueries = querySpy.mock.calls.length;
      querySpy.mockClear();
      await service.listThreads(large.video.id, 0, 10, large.user.id);

      expect(querySpy.mock.calls.length).toBe(smallQueries);
    });
  });

  describe('setReaction', () => {
    async function likesOf(id: string): Promise<number> {
      return (await dataSource.getRepository(Comment).findOneByOrFail({ id }))
        .likes_count;
    }

    it('returns to zero after none → like → dislike → none', async () => {
      const { user, video } = await setup();
      const root = await seedComment(video.id, user.id, 5);

      const liked = await service.setReaction(root, user.id, ReactionType.LIKE);
      expect(liked).toEqual({
        viewerReaction: ReactionType.LIKE,
        likesCount: 1,
      });
      await service.setReaction(root, user.id, ReactionType.DISLIKE);
      const removed = await service.setReaction(root, user.id, null);

      expect(removed).toEqual({ viewerReaction: null, likesCount: 0 });
      expect(await likesOf(root.id)).toBe(0);
    });

    it('does not touch the root when reacting to a reply', async () => {
      const { user, video } = await setup();
      const root = await seedComment(video.id, user.id, 5);
      const reply = await seedComment(video.id, user.id, 4, root.id);

      await service.setReaction(reply, user.id, ReactionType.LIKE);

      expect(await likesOf(reply.id)).toBe(1);
      expect(await likesOf(root.id)).toBe(0);
    });
  });
});

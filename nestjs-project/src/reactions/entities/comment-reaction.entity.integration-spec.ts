import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';
import { Channel } from '../../channels/entities/channel.entity';
import { Comment } from '../../comments/entities/comment.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../../test/social-fixtures';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import { ReactionType } from '../reaction-type.enum';
import { CommentReaction } from './comment-reaction.entity';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Comment,
  CommentReaction,
];

describe('CommentReaction entity (integration)', () => {
  let dataSource: DataSource;
  let reactions: Repository<CommentReaction>;
  let comments: Repository<Comment>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    reactions = dataSource.getRepository(CommentReaction);
    comments = dataSource.getRepository(Comment);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "comment_reactions"');
    await dataSource.query('DELETE FROM "comments"');
    await cleanAllTables(dataSource);
  });

  async function setup() {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);
    const comment = await comments.save(
      comments.create({ video_id: video.id, user_id: user.id, body: 'Oi' }),
    );
    return { user, comment };
  }

  it('rejects a second reaction row for the same user and comment', async () => {
    const { user, comment } = await setup();
    await reactions.save(
      reactions.create({
        user_id: user.id,
        comment_id: comment.id,
        type: ReactionType.LIKE,
      }),
    );

    await expect(
      dataSource.query(
        `INSERT INTO "comment_reactions" ("user_id", "comment_id", "type") VALUES ($1, $2, 'dislike')`,
        [user.id, comment.id],
      ),
    ).rejects.toThrow();
  });

  it('removes the reactions when the comment is deleted', async () => {
    const { user, comment } = await setup();
    await reactions.save(
      reactions.create({
        user_id: user.id,
        comment_id: comment.id,
        type: ReactionType.DISLIKE,
      }),
    );

    await comments.delete({ id: comment.id });

    expect(await reactions.count()).toBe(0);
  });
});

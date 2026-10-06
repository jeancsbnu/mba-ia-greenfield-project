import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';
import { Channel } from '../../channels/entities/channel.entity';
import { CommentReaction } from '../../reactions/entities/comment-reaction.entity';
import { ReactionType } from '../../reactions/reaction-type.enum';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../../test/social-fixtures';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import { Comment } from './comment.entity';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Comment,
  CommentReaction,
];

describe('Comment entity (integration)', () => {
  let dataSource: DataSource;
  let comments: Repository<Comment>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
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
    return { user, video };
  }

  it('creates a root comment with a null parent and zero likes', async () => {
    const { user, video } = await setup();
    const saved = await comments.save(
      comments.create({ video_id: video.id, user_id: user.id, body: 'Oi' }),
    );

    const found = await comments.findOneByOrFail({ id: saved.id });
    expect(found.parent_id).toBeNull();
    expect(found.likes_count).toBe(0);
  });

  it('accepts a reply pointing at a root comment', async () => {
    const { user, video } = await setup();
    const root = await comments.save(
      comments.create({ video_id: video.id, user_id: user.id, body: 'Raiz' }),
    );
    const reply = await comments.save(
      comments.create({
        video_id: video.id,
        user_id: user.id,
        parent_id: root.id,
        body: 'Resposta',
      }),
    );

    expect((await comments.findOneByOrFail({ id: reply.id })).parent_id).toBe(
      root.id,
    );
  });

  it('removes the comments when the video is deleted', async () => {
    const { user, video } = await setup();
    await comments.save(
      comments.create({ video_id: video.id, user_id: user.id, body: 'Oi' }),
    );

    await dataSource.getRepository(Video).delete({ id: video.id });

    expect(await comments.count()).toBe(0);
  });

  it('removes replies and all their reactions when the root is deleted', async () => {
    const { user, video } = await setup();
    const root = await comments.save(
      comments.create({ video_id: video.id, user_id: user.id, body: 'Raiz' }),
    );
    const reply = await comments.save(
      comments.create({
        video_id: video.id,
        user_id: user.id,
        parent_id: root.id,
        body: 'Resposta',
      }),
    );
    const reactions = dataSource.getRepository(CommentReaction);
    await reactions.save([
      reactions.create({
        user_id: user.id,
        comment_id: root.id,
        type: ReactionType.LIKE,
      }),
      reactions.create({
        user_id: user.id,
        comment_id: reply.id,
        type: ReactionType.LIKE,
      }),
    ]);

    await comments.delete({ id: root.id });

    expect(await comments.count()).toBe(0);
    expect(await reactions.count()).toBe(0);
  });
});

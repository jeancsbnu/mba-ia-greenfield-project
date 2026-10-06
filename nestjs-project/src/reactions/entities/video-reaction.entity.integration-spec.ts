import { DataSource, Repository } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';
import { Channel } from '../../channels/entities/channel.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { createUserWithChannel, createVideo } from '../../test/social-fixtures';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import { ReactionType } from '../reaction-type.enum';
import { VideoReaction } from './video-reaction.entity';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  VideoReaction,
];

describe('VideoReaction entity (integration)', () => {
  let dataSource: DataSource;
  let reactions: Repository<VideoReaction>;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    reactions = dataSource.getRepository(VideoReaction);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "video_reactions"');
    await cleanAllTables(dataSource);
  });

  async function setup() {
    const { user, channel } = await createUserWithChannel(dataSource);
    const video = await createVideo(dataSource, channel.id);
    return { user, video };
  }

  it('rejects a second reaction row for the same user and video', async () => {
    const { user, video } = await setup();
    await dataSource.query(
      `INSERT INTO "video_reactions" ("user_id", "video_id", "type") VALUES ($1, $2, 'like')`,
      [user.id, video.id],
    );

    await expect(
      dataSource.query(
        `INSERT INTO "video_reactions" ("user_id", "video_id", "type") VALUES ($1, $2, 'dislike')`,
        [user.id, video.id],
      ),
    ).rejects.toThrow();
  });

  it('accepts switching the type of the existing row', async () => {
    const { user, video } = await setup();
    await reactions.save(
      reactions.create({
        user_id: user.id,
        video_id: video.id,
        type: ReactionType.LIKE,
      }),
    );

    await reactions.update(
      { user_id: user.id, video_id: video.id },
      { type: ReactionType.DISLIKE },
    );

    const rows = await reactions.find({ where: { video_id: video.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe(ReactionType.DISLIKE);
  });

  it('rejects a type outside the enum', async () => {
    const { user, video } = await setup();
    await expect(
      dataSource.query(
        `INSERT INTO "video_reactions" ("user_id", "video_id", "type") VALUES ($1, $2, 'love')`,
        [user.id, video.id],
      ),
    ).rejects.toThrow();
  });

  it('removes the reactions when the video is deleted', async () => {
    const { user, video } = await setup();
    await reactions.save(
      reactions.create({
        user_id: user.id,
        video_id: video.id,
        type: ReactionType.LIKE,
      }),
    );

    await dataSource.getRepository(Video).delete({ id: video.id });

    expect(await reactions.count()).toBe(0);
  });
});

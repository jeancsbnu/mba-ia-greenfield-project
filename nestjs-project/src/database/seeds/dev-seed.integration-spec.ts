import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as argon2 from 'argon2';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { VerificationToken } from '../../auth/entities/verification-token.entity';
import { Channel } from '../../channels/entities/channel.entity';
import { Comment } from '../../comments/entities/comment.entity';
import storageConfig from '../../config/storage.config';
import { CommentReaction } from '../../reactions/entities/comment-reaction.entity';
import { VideoReaction } from '../../reactions/entities/video-reaction.entity';
import { StorageService } from '../../storage/storage.service';
import { Subscription } from '../../subscriptions/entities/subscription.entity';
import {
  cleanAllTables,
  createTestDataSource,
} from '../../test/create-test-data-source';
import { User } from '../../users/entities/user.entity';
import { Video } from '../../videos/entities/video.entity';
import {
  SEED_COMMENTS,
  SEED_PASSWORD,
  SEED_USERS,
  SEED_VIDEOS,
} from './dev-seed.data';
import {
  seedDevData,
  seedStorageKey,
  seedThumbnailKey,
  type DevSeedOptions,
  type DevSeedResult,
} from './dev-seed';
import { createFfmpegRenderer } from './dev-seed-media';

const ALL_ENTITIES = [
  User,
  Channel,
  RefreshToken,
  VerificationToken,
  Video,
  Comment,
  Subscription,
  VideoReaction,
  CommentReaction,
];

describe('seedDevData (integration)', () => {
  let dataSource: DataSource;
  let storage: StorageService;
  let options: DevSeedOptions;
  let result: DevSeedResult;

  beforeAll(async () => {
    dataSource = createTestDataSource(ALL_ENTITIES);
    await dataSource.initialize();
    await cleanAllTables(dataSource);

    // Bucket só do teste: o seed grava em chaves fixas (seed/<publicId>.mp4) e
    // o afterAll as apaga — no bucket do dev isso destruiria a mídia que o
    // `npm run seed` gravou lá. onModuleInit cria o bucket se faltar.
    const config = storageConfig();
    const testBucket = `${config.minioBucket}-seed-test`;
    storage = new StorageService({ ...config, minioBucket: testBucket });
    await storage.onModuleInit();
    options = {
      bucket: testBucket,
      // Resolução mínima: o teste prova o contrato com ffmpeg e MinIO reais,
      // não a qualidade da mídia.
      renderMedia: createFfmpegRenderer({ size: '64x36', rate: 5 }),
      now: new Date('2026-10-01T12:00:00Z'),
    };

    result = await seedDevData(dataSource, storage, options);
  }, 120000);

  afterAll(async () => {
    await cleanAllTables(dataSource);
    for (const video of SEED_VIDEOS) {
      await storage.deleteObject(
        options.bucket,
        seedStorageKey(video.publicId),
      );
      await storage.deleteObject(
        options.bucket,
        seedThumbnailKey(video.publicId),
      );
    }
    await dataSource.destroy();
  });

  it('seeds confirmed accounts that log in with the seed password', async () => {
    expect(result).toEqual(
      expect.objectContaining({
        status: 'seeded',
        users: SEED_USERS.length,
        videos: SEED_VIDEOS.length,
      }),
    );

    const users = await dataSource
      .getRepository(User)
      .find({ select: { email: true, password: true, is_confirmed: true } });
    expect(users).toHaveLength(SEED_USERS.length);
    for (const user of users) {
      expect(user.is_confirmed).toBe(true);
      await expect(argon2.verify(user.password, SEED_PASSWORD)).resolves.toBe(
        true,
      );
    }
    expect(await dataSource.getRepository(Channel).count()).toBe(
      SEED_USERS.length,
    );
  });

  it('stores a playable video and a thumbnail for every seeded video', async () => {
    const videos = await dataSource.getRepository(Video).find();
    expect(videos).toHaveLength(SEED_VIDEOS.length);

    const workDir = await mkdtemp(join(tmpdir(), 'dev-seed-spec-'));
    try {
      for (const video of videos) {
        expect(video.status).toBe('ready');
        const videoPath = join(workDir, `${video.public_id}.mp4`);
        await storage.downloadToFile(
          video.storage_bucket as string,
          video.storage_key as string,
          videoPath,
        );
        const bytes = await readFile(videoPath);
        expect(bytes.length).toBe(video.file_size_bytes);
        // Caixa "ftyp" do contêiner MP4 nos bytes 4..7.
        expect(bytes.subarray(4, 8).toString('ascii')).toBe('ftyp');

        const thumbnailPath = join(workDir, `${video.public_id}.jpg`);
        await storage.downloadToFile(
          video.storage_bucket as string,
          video.thumbnail_key as string,
          thumbnailPath,
        );
        const thumbnail = await readFile(thumbnailPath);
        // Assinatura JPEG (SOI).
        expect(thumbnail.subarray(0, 2).toString('hex')).toBe('ffd8');
      }
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }, 60000);

  it('keeps every denormalized counter equal to the rows behind it', async () => {
    const driftedVideos = await dataSource.query<unknown[]>(
      `SELECT v."public_id" FROM "videos" v
       WHERE v."likes_count" <> (SELECT count(*) FROM "video_reactions" r
                                 WHERE r."video_id" = v."id" AND r."type" = 'like')
          OR v."comments_count" <> (SELECT count(*) FROM "comments" c
                                    WHERE c."video_id" = v."id")`,
    );
    const driftedChannels = await dataSource.query<unknown[]>(
      `SELECT c."nickname" FROM "channels" c
       WHERE c."subscribers_count" <> (SELECT count(*) FROM "subscriptions" s
                                       WHERE s."channel_id" = c."id")`,
    );
    const driftedComments = await dataSource.query<unknown[]>(
      `SELECT c."id" FROM "comments" c
       WHERE c."likes_count" <> (SELECT count(*) FROM "comment_reactions" r
                                 WHERE r."comment_id" = c."id" AND r."type" = 'like')`,
    );
    expect(driftedVideos).toEqual([]);
    expect(driftedChannels).toEqual([]);
    expect(driftedComments).toEqual([]);

    // Controle: o recálculo produziu contagens diferentes de zero.
    const [totals] = await dataSource.query<
      { likes: string; comments: string; subscribers: string }[]
    >(
      `SELECT (SELECT sum("likes_count") FROM "videos") AS likes,
              (SELECT sum("comments_count") FROM "videos") AS comments,
              (SELECT sum("subscribers_count") FROM "channels") AS subscribers`,
    );
    expect(Number(totals.likes)).toBeGreaterThan(0);
    expect(Number(totals.comments)).toBe(SEED_COMMENTS.length);
    expect(Number(totals.subscribers)).toBeGreaterThan(0);
  });

  it('keeps replies one level deep, attached to root comments', async () => {
    const nested = await dataSource.query<unknown[]>(
      `SELECT r."id" FROM "comments" r
       JOIN "comments" p ON p."id" = r."parent_id"
       WHERE p."parent_id" IS NOT NULL`,
    );
    expect(nested).toEqual([]);
  });

  it('does nothing when run again', async () => {
    const before = await dataSource.getRepository(Video).count();

    const rerun = await seedDevData(dataSource, storage, options);

    expect(rerun).toEqual({ status: 'skipped' });
    expect(await dataSource.getRepository(Video).count()).toBe(before);
    expect(await dataSource.getRepository(User).count()).toBe(
      SEED_USERS.length,
    );
  });
});

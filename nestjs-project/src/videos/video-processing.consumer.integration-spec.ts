import { spawnSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Job } from 'bullmq';
import ffmpegPath from 'ffmpeg-static';
import { DataSource, Repository } from 'typeorm';
import { Channel } from '../channels/entities/channel.entity';
import storageConfig from '../config/storage.config';
import { StorageService } from '../storage/storage.service';
import { createTestDataSource } from '../test/create-test-data-source';
import { User } from '../users/entities/user.entity';
import { Video, VideoStatus } from './entities/video.entity';
import { VideoProcessingConsumer } from './video-processing.consumer';
import type { VideoProcessingJobPayload } from './video-processing.producer';

describe('VideoProcessingConsumer (integration)', () => {
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelRepository: Repository<Channel>;
  let userRepository: Repository<User>;
  let storageService: StorageService;
  let consumer: VideoProcessingConsumer;
  let bucket: string;
  let channelId: string;
  let validVideoPath: string;
  let corruptedVideoPath: string;

  beforeAll(async () => {
    dataSource = createTestDataSource([User, Channel, Video]);
    await dataSource.initialize();
    videoRepository = dataSource.getRepository(Video);
    channelRepository = dataSource.getRepository(Channel);
    userRepository = dataSource.getRepository(User);

    const config = storageConfig();
    bucket = config.minioBucket;
    storageService = new StorageService(config);
    await storageService.onModuleInit();
    consumer = new VideoProcessingConsumer(videoRepository, storageService);

    const user = await userRepository.save(
      userRepository.create({
        email: 'worker-fixture@example.com',
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Worker Fixture',
        nickname: 'worker-fixture',
        user_id: user.id,
      }),
    );
    channelId = channel.id;

    validVideoPath = join(tmpdir(), `consumer-fixture-${Date.now()}.mp4`);
    spawnSync(ffmpegPath as string, [
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=duration=2:size=64x64:rate=10',
      '-pix_fmt',
      'yuv420p',
      validVideoPath,
    ]);

    corruptedVideoPath = join(tmpdir(), `consumer-corrupted-${Date.now()}.mp4`);
    await writeFile(corruptedVideoPath, 'this is not a real video file');
  }, 30000);

  afterAll(async () => {
    await rm(validVideoPath, { force: true });
    await rm(corruptedVideoPath, { force: true });
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "videos"');
  });

  async function createVideo(): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `pub${Math.random().toString(36).slice(2, 9)}`,
        channel_id: channelId,
        title: 'Processing Video',
        status: VideoStatus.DRAFT,
      }),
    );
  }

  function buildJob(
    videoId: string,
    storageKey: string,
  ): Job<VideoProcessingJobPayload> {
    return {
      data: { videoId, storageBucket: bucket, storageKey },
    } as Job<VideoProcessingJobPayload>;
  }

  it('processes a valid video: extracts duration, uploads thumbnail, marks ready', async () => {
    const video = await createVideo();
    const storageKey = `test/${video.id}/original.mp4`;
    const fileBuffer = await readFile(validVideoPath);
    await storageService.putObject(bucket, storageKey, fileBuffer, 'video/mp4');

    await consumer.process(buildJob(video.id, storageKey));

    const updated = await videoRepository.findOneOrFail({
      where: { id: video.id },
    });
    expect(updated.status).toBe(VideoStatus.READY);
    expect(updated.duration_seconds).toBeGreaterThanOrEqual(1);
    expect(updated.thumbnail_key).toBe(`${storageKey}-thumbnail.jpg`);
    expect(updated.processing_error).toBeNull();
  }, 30000);

  it('marks the video as failed with processing_error when the file is corrupted', async () => {
    const video = await createVideo();
    const storageKey = `test/${video.id}/corrupted.mp4`;
    const fileBuffer = await readFile(corruptedVideoPath);
    await storageService.putObject(bucket, storageKey, fileBuffer, 'video/mp4');

    await expect(
      consumer.process(buildJob(video.id, storageKey)),
    ).rejects.toThrow();

    const updated = await videoRepository.findOneOrFail({
      where: { id: video.id },
    });
    expect(updated.status).toBe(VideoStatus.FAILED);
    expect(updated.processing_error).toBeTruthy();
  }, 30000);
});

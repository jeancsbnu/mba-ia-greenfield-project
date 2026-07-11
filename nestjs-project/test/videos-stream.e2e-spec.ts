import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { Channel } from '../src/channels/entities/channel.entity';
import storageConfig from '../src/config/storage.config';
import { User } from '../src/users/entities/user.entity';
import { Video, VideoStatus } from '../src/videos/entities/video.entity';

describe('GET /videos/:publicId/stream and /download (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelRepository: Repository<Channel>;
  let userRepository: Repository<User>;
  let bucket: string;
  let channelId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(
      new DomainExceptionFilter(),
      new ValidationExceptionFilter(),
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    videoRepository = dataSource.getRepository(Video);
    channelRepository = dataSource.getRepository(Channel);
    userRepository = dataSource.getRepository(User);
    bucket = app.get<ConfigType<typeof storageConfig>>(
      storageConfig.KEY,
    ).minioBucket;

    const user = await userRepository.save(
      userRepository.create({
        email: 'stream-fixture@example.com',
        password: 'hashed',
      }),
    );
    const channel = await channelRepository.save(
      channelRepository.create({
        name: 'Stream Fixture Channel',
        nickname: 'stream-fixture',
        user_id: user.id,
      }),
    );
    channelId = channel.id;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM "videos"');
  });

  async function createVideo(overrides: Partial<Video> = {}): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `pub${Math.random().toString(36).slice(2, 9)}`,
        channel_id: channelId,
        title: 'Streamable Video',
        status: VideoStatus.READY,
        storage_bucket: bucket,
        storage_key: 'videos/streamable-key.mp4',
        ...overrides,
      }),
    );
  }

  it('redirects to a presigned storage URL for a ready video, without requiring auth', async () => {
    const video = await createVideo();

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}/stream`)
      .redirects(0)
      .expect(302);

    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain(video.storage_key);
    expect(res.headers.location).not.toContain('response-content-disposition');
  });

  it('redirects to a presigned download URL with attachment disposition, without requiring auth', async () => {
    const video = await createVideo();

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}/download`)
      .redirects(0)
      .expect(302);

    expect(res.headers.location).toBeDefined();
    expect(res.headers.location).toContain(video.storage_key);
    expect(res.headers.location).toContain('response-content-disposition');
  });

  it('returns 409 with errorCode VIDEO_NOT_READY when the video is still processing', async () => {
    const video = await createVideo({ status: VideoStatus.PROCESSING });

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}/stream`)
      .redirects(0)
      .expect(409);

    expect(res.body.error).toBe('VIDEO_NOT_READY');
  });

  it('returns 404 with errorCode VIDEO_NOT_FOUND for an unknown publicId on stream', async () => {
    const res = await request(app.getHttpServer())
      .get('/videos/doesnotexist/stream')
      .redirects(0)
      .expect(404);

    expect(res.body.error).toBe('VIDEO_NOT_FOUND');
  });
});

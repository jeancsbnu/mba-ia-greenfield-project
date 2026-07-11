import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ChannelsService } from '../src/channels/channels.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video, VideoStatus } from '../src/videos/entities/video.entity';

interface AuthenticatedUser {
  userId: string;
  accessToken: string;
}

describe('GET /videos/:publicId (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let channelsService: ChannelsService;
  let throttlerStorage: ThrottlerStorageService;

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
    channelsService = app.get(ChannelsService);
    throttlerStorage =
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();
  });

  async function registerConfirmAndLogin(
    email: string,
    password = 'password123',
  ): Promise<AuthenticatedUser> {
    const authService = app.get(AuthService);
    const mailServiceInstance = (authService as any).mailService;
    let capturedToken = '';
    jest
      .spyOn(mailServiceInstance, 'sendConfirmationEmail')
      .mockImplementationOnce(async (_e: string, _n: string, t: string) => {
        capturedToken = t;
      });
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password });
    await request(app.getHttpServer())
      .get('/auth/confirm-email')
      .query({ token: capturedToken });
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    return {
      userId: registerRes.body.id,
      accessToken: loginRes.body.access_token,
    };
  }

  async function createVideoForChannel(
    channelId: string,
    overrides: Partial<Video> = {},
  ): Promise<Video> {
    return videoRepository.save(
      videoRepository.create({
        public_id: `pub${Math.random().toString(36).slice(2, 9)}`,
        channel_id: channelId,
        title: 'My Video',
        status: VideoStatus.READY,
        duration_seconds: 42,
        ...overrides,
      }),
    );
  }

  it('returns 200 with status, title and durationSeconds for the video owner', async () => {
    const owner = await registerConfirmAndLogin('owner@example.com');
    const channel = await channelsService.findByUserId(owner.userId);
    const video = await createVideoForChannel(channel!.id, {
      title: 'Owned Video',
      duration_seconds: 120,
    });

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      publicId: video.public_id,
      title: 'Owned Video',
      status: VideoStatus.READY,
      durationSeconds: 120,
    });
  });

  it('returns 404 with errorCode VIDEO_NOT_FOUND when the video does not exist', async () => {
    const user = await registerConfirmAndLogin('missing@example.com');

    const res = await request(app.getHttpServer())
      .get('/videos/doesnotexist')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .expect(404);

    expect(res.body.error).toBe('VIDEO_NOT_FOUND');
  });

  it('returns 403 with errorCode FORBIDDEN when the caller is not the channel owner', async () => {
    const owner = await registerConfirmAndLogin('video-owner@example.com');
    const ownerChannel = await channelsService.findByUserId(owner.userId);
    const video = await createVideoForChannel(ownerChannel!.id);

    const stranger = await registerConfirmAndLogin('stranger@example.com');

    const res = await request(app.getHttpServer())
      .get(`/videos/${video.public_id}`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .expect(403);

    expect(res.body.error).toBe('FORBIDDEN');
  });
});

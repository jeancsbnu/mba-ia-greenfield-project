import express from 'express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';
import { Queue } from 'bullmq';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { cleanAllTables } from '../src/test/create-test-data-source';
import { Video, VideoStatus } from '../src/videos/entities/video.entity';
import { createTusUploadServer } from '../src/videos/tus-upload.server';

describe('POST /videos/upload (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let videoRepository: Repository<Video>;
  let queue: Queue;
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

    const tusServer = createTusUploadServer(app);
    const uploadApp = express();
    uploadApp.use((req, res) => tusServer.handle(req, res));
    app.use('/videos/upload', uploadApp);

    await app.init();

    dataSource = moduleFixture.get(DataSource);
    videoRepository = dataSource.getRepository(Video);
    queue = moduleFixture.get(getQueueToken('video-processing'));
    throttlerStorage =
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanAllTables(dataSource);
    throttlerStorage.storage.clear();
    await queue.drain(true);
  });

  async function registerConfirmAndLogin(
    email: string,
    password = 'password123',
  ): Promise<string> {
    const authService = app.get(AuthService);
    const mailServiceInstance = (authService as any).mailService;
    let capturedToken = '';
    jest
      .spyOn(mailServiceInstance, 'sendConfirmationEmail')
      .mockImplementationOnce(async (_e: string, _n: string, t: string) => {
        capturedToken = t;
      });
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password });
    await request(app.getHttpServer())
      .get('/auth/confirm-email')
      .query({ token: capturedToken });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    return res.body.access_token;
  }

  function metadataHeader(fields: Record<string, string>): string {
    return Object.entries(fields)
      .map(([key, value]) => `${key} ${Buffer.from(value).toString('base64')}`)
      .join(',');
  }

  it('creates a draft video on session creation and enqueues processing on completion', async () => {
    const accessToken = await registerConfirmAndLogin('uploader@example.com');
    const fileContent = Buffer.from('hello streamtube video bytes');

    const createRes = await request(app.getHttpServer())
      .post('/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Length', String(fileContent.length))
      .set(
        'Upload-Metadata',
        metadataHeader({ title: 'My Video', description: 'A description' }),
      )
      .expect(201);

    expect(createRes.headers.location).toBeDefined();
    const uploadPath = new URL(createRes.headers.location, 'http://localhost')
      .pathname;
    const uploadId = uploadPath.split('/').pop() as string;

    const draft = await videoRepository.findOne({
      where: { upload_id: uploadId },
    });
    expect(draft).not.toBeNull();
    expect(draft?.status).toBe(VideoStatus.DRAFT);
    expect(draft?.title).toBe('My Video');
    expect(draft?.description).toBe('A description');

    await request(app.getHttpServer())
      .patch(uploadPath)
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Offset', '0')
      .set('Content-Type', 'application/offset+octet-stream')
      .send(fileContent)
      .expect(204);

    const jobs = await queue.getJobs(['waiting', 'active', 'delayed']);
    const job = jobs.find((j) => j.data.videoId === draft?.id);
    expect(job).toBeDefined();
    expect(job?.name).toBe('video.processing');
  });

  it('rejects Upload-Length above 10GB with 400 and errorCode UPLOAD_FILE_TOO_LARGE', async () => {
    const accessToken = await registerConfirmAndLogin('bigfile@example.com');
    const tooLargeBytes = 10 * 1024 * 1024 * 1024 + 1;

    const res = await request(app.getHttpServer())
      .post('/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Length', String(tooLargeBytes))
      .expect(400);

    expect(JSON.parse(res.text).error).toBe('UPLOAD_FILE_TOO_LARGE');
  });

  it('returns 401 without an Authorization header', async () => {
    await request(app.getHttpServer())
      .post('/videos/upload')
      .set('Tus-Resumable', '1.0.0')
      .set('Upload-Length', '100')
      .expect(401);
  });
});

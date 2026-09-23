import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { Channel } from '../src/channels/entities/channel.entity';
import { ChannelsService } from '../src/channels/channels.service';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { cleanAllTables } from '../src/test/create-test-data-source';

interface MailServiceLike {
  sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}

interface AuthenticatedUser {
  userId: string;
  accessToken: string;
  nickname: string;
}

interface ChannelResponse {
  name: string;
  nickname: string;
  description: string | null;
}

// Spec: nestjs-project/specs/me-channel.plan.md (SI-04.5)
describe('GET e PATCH /me/channel — canal do dono (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let channelRepository: Repository<Channel>;
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
    channelRepository = dataSource.getRepository(Channel);
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

  let emailCounter = 0;
  async function registerConfirmAndLogin(): Promise<AuthenticatedUser> {
    const email = `me_channel_${++emailCounter}@example.com`;
    const password = 'password123';

    const authService = app.get(AuthService);
    const mailServiceInstance = (
      authService as unknown as { mailService: MailServiceLike }
    ).mailService;
    let capturedToken = '';
    jest
      .spyOn(mailServiceInstance, 'sendConfirmationEmail')
      .mockImplementationOnce((_e: string, _n: string, t: string) => {
        capturedToken = t;
        return Promise.resolve();
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

    const userId = (registerRes.body as { id: string }).id;
    const channel = await channelsService.findByUserId(userId);

    return {
      userId,
      accessToken: (loginRes.body as { access_token: string }).access_token,
      nickname: channel?.nickname ?? '',
    };
  }

  // Cenário 1.1 do spec
  it('returns the current channel data', async () => {
    const owner = await registerConfirmAndLogin();

    const res = await request(app.getHttpServer())
      .get('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(res.status).toBe(200);
    const body = res.body as ChannelResponse;
    expect(body.nickname).toBe(owner.nickname);
    expect(typeof body.name).toBe('string');
    expect(body).toHaveProperty('description');
  }, 30000);

  // Cenário 1.2 do spec
  it('updates nickname, name and description', async () => {
    const owner = await registerConfirmAndLogin();

    const res = await request(app.getHttpServer())
      .patch('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        nickname: 'joana_nova',
        name: 'Joana Nova',
        description: '',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      nickname: 'joana_nova',
      name: 'Joana Nova',
      description: null,
    });

    const get = await request(app.getHttpServer())
      .get('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`);
    expect((get.body as ChannelResponse).nickname).toBe('joana_nova');
  }, 30000);

  // Cenário 1.3 do spec
  it('rejects a nickname owned by another channel', async () => {
    const first = await registerConfirmAndLogin();
    const second = await registerConfirmAndLogin();

    const res = await request(app.getHttpServer())
      .patch('/me/channel')
      .set('Authorization', `Bearer ${second.accessToken}`)
      .send({ nickname: first.nickname });

    expect(res.status).toBe(409);
    expect((res.body as { error: string }).error).toBe(
      'NICKNAME_ALREADY_EXISTS',
    );

    const stored = await channelRepository.findOneByOrFail({
      user_id: second.userId,
    });
    expect(stored.nickname).toBe(second.nickname);
  }, 30000);

  // Cenário 1.4 do spec
  it('validates the update body', async () => {
    const owner = await registerConfirmAndLogin();

    const dotted = await request(app.getHttpServer())
      .patch('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ nickname: 'joana.cria' });
    expect(dotted.status).toBe(400);

    const emptyName = await request(app.getHttpServer())
      .patch('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: '' });
    expect(emptyName.status).toBe(400);

    const emptyBody = await request(app.getHttpServer())
      .patch('/me/channel')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({});
    expect(emptyBody.status).toBe(400);

    const stored = await channelRepository.findOneByOrFail({
      user_id: owner.userId,
    });
    expect(stored.nickname).toBe(owner.nickname);
  }, 30000);

  // Cenário 1.5 do spec
  it('requires authentication on both verbs', async () => {
    const get = await request(app.getHttpServer()).get('/me/channel');
    expect(get.status).toBe(401);

    const patch = await request(app.getHttpServer())
      .patch('/me/channel')
      .send({ name: 'Sem token' });
    expect(patch.status).toBe(401);
  }, 30000);
});

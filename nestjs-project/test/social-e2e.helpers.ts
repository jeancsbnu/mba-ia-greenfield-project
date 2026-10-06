import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ChannelsService } from '../src/channels/channels.service';
import { Channel } from '../src/channels/entities/channel.entity';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ThrottlerExceptionFilter } from '../src/common/filters/throttler-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import {
  Video,
  VideoStatus,
  VideoVisibility,
} from '../src/videos/entities/video.entity';

// Suporte compartilhado pelas suítes E2E da Fase 06: sobe o AppModule com a
// mesma configuração global do main.ts e registra usuários pelo fluxo real de
// cadastro → confirmação → login, como as suítes das fases anteriores.

export interface SocialE2eContext {
  app: INestApplication<App>;
  dataSource: DataSource;
  throttlerStorage: ThrottlerStorageService;
}

export interface AuthenticatedUser {
  userId: string;
  channel: Channel;
  accessToken: string;
}

interface MailServiceLike {
  sendConfirmationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void>;
}

export async function createSocialApp(): Promise<SocialE2eContext> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
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
    new ThrottlerExceptionFilter(),
  );
  await app.init();

  return {
    app,
    dataSource: moduleFixture.get(DataSource),
    throttlerStorage:
      moduleFixture.get<ThrottlerStorageService>(ThrottlerStorage),
  };
}

let emailCounter = 0;

export async function registerConfirmAndLogin(
  app: INestApplication<App>,
  prefix: string,
): Promise<AuthenticatedUser> {
  const email = `${prefix}_${++emailCounter}_${Date.now()}@example.com`;
  const password = 'password123';

  const authService = app.get(AuthService);
  const mailService = (
    authService as unknown as { mailService: MailServiceLike }
  ).mailService;
  let capturedToken = '';
  jest
    .spyOn(mailService, 'sendConfirmationEmail')
    .mockImplementationOnce((_e: string, _n: string, token: string) => {
      capturedToken = token;
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
  const channel = await app.get(ChannelsService).findByUserId(userId);
  if (!channel) {
    throw new Error(`registration did not create a channel for ${email}`);
  }

  return {
    userId,
    channel,
    accessToken: (loginRes.body as { access_token: string }).access_token,
  };
}

/** Renomeia o canal recém-criado para um nickname conhecido pelo cenário. */
export async function renameChannel(
  dataSource: DataSource,
  channel: Channel,
  nickname: string,
  name = nickname,
): Promise<Channel> {
  await dataSource
    .getRepository(Channel)
    .update({ id: channel.id }, { nickname, name });
  return { ...channel, nickname, name };
}

let videoCounter = 0;

export async function createPublishedVideo(
  dataSource: DataSource,
  channelId: string,
  overrides: Partial<Video> = {},
): Promise<Video> {
  const repository = dataSource.getRepository(Video);
  return repository.save(
    repository.create({
      public_id: `s${++videoCounter}${Date.now() % 1_000_000}`.slice(0, 10),
      channel_id: channelId,
      title: 'Vídeo social',
      status: VideoStatus.READY,
      storage_bucket: 'videos',
      storage_key: 'videos/streamable-key.mp4',
      published_at: new Date(),
      visibility: VideoVisibility.PUBLIC,
      ...overrides,
    }),
  );
}

/** Rascunho = `published_at` nulo, independentemente do status. */
export function createDraftVideo(
  dataSource: DataSource,
  channelId: string,
): Promise<Video> {
  return createPublishedVideo(dataSource, channelId, { published_at: null });
}

export function bearer(user: AuthenticatedUser): { Authorization: string } {
  return { Authorization: `Bearer ${user.accessToken}` };
}

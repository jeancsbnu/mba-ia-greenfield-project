import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DomainExceptionFilter } from '../src/common/filters/domain-exception.filter';
import { ThrottlerExceptionFilter } from '../src/common/filters/throttler-exception.filter';
import { ValidationExceptionFilter } from '../src/common/filters/validation-exception.filter';
import { buildSwaggerConfig } from '../src/swagger/swagger-document';

// Spec: nestjs-project/specs/health.plan.md (SI-07.16)
// A rota não lê dados: sem limpeza nem seed, os cenários valem com o banco de
// teste vazio.
describe('health', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<INestApplication<App>>();
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
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // 1. Saúde da API

  it('1.1 responde-ok-sem-autenticacao-e-sem-dados', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  it('1.2 token-invalido-nao-bloqueia-a-rota-publica', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('Authorization', 'Bearer token-invalido')
      .expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });

  // 2. Fora do contrato OpenAPI

  it('2.1 documento-swagger-nao-contem-health', () => {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());

    expect(document.paths).not.toHaveProperty(['/health']);
    expect(document.paths).toHaveProperty(['/auth/login']);
  });
});

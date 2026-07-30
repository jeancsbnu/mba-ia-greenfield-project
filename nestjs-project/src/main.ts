import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import swaggerConfig from './config/swagger.config';
import { buildSwaggerDocument } from './swagger/swagger-document';
import swaggerMetadata from './metadata.js';
import { createTusUploadServer } from './videos/tus-upload.server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;

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

  const swagger = app.get<ConfigType<typeof swaggerConfig>>(swaggerConfig.KEY);

  if (swagger.enabled) {
    await SwaggerModule.loadPluginMetadata(swaggerMetadata);
    const document = buildSwaggerDocument(app);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'StreamTube API Docs',
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const tusServer = createTusUploadServer(app);
  const uploadApp = express();
  uploadApp.use((req, res) => tusServer.handle(req, res));
  app.use('/videos/upload', uploadApp);

  await app.listen(port);
}
void bootstrap();

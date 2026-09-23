import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiErrorEnvelope } from '../common/openapi/api-error-envelope.dto';
import {
  ChannelResponse,
  PublicChannelResponse,
} from '../channels/dto/channel-response.dto';
import { VideoDetailResponse } from '../videos/dto/video-detail-response.dto';
import {
  OwnerVideosPage,
  PublicVideosPage,
} from '../videos/dto/video-list-response.dto';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('StreamTube API')
    .setDescription('API REST do StreamTube')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
}

export function buildSwaggerDocument(app: INestApplication) {
  return SwaggerModule.createDocument(app, buildSwaggerConfig(), {
    extraModels: [
      ApiErrorEnvelope,
      ChannelResponse,
      PublicChannelResponse,
      VideoDetailResponse,
      OwnerVideosPage,
      PublicVideosPage,
    ],
  });
}

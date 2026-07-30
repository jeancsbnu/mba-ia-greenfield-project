import type { IncomingMessage } from 'node:http';
import { S3Store } from '@tus/s3-store';
import { Server } from '@tus/server';
import type { INestApplication } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { nanoid } from 'nanoid';
import type { Repository } from 'typeorm';
import { BEARER_PREFIX } from '../auth/auth.constants';
import type { JwtPayload } from '../auth/auth.types';
import { ChannelsService } from '../channels/channels.service';
import storageConfig from '../config/storage.config';
import { Video, VideoStatus } from './entities/video.entity';
import { VideoProcessingProducer } from './video-processing.producer';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024 * 1024;

interface TusRequest extends IncomingMessage {
  userId?: string;
}

class TusHookError extends Error {
  readonly status_code: number;
  readonly body: string;

  constructor(status_code: number, error: string, message: string) {
    super(message);
    this.status_code = status_code;
    this.body = JSON.stringify({ statusCode: status_code, error, message });
  }
}

function unauthorizedError(): TusHookError {
  return new TusHookError(401, 'UNAUTHORIZED', 'Unauthorized');
}

export function createTusUploadServer(app: INestApplication): Server {
  const jwtService = app.get(JwtService);
  const channelsService = app.get(ChannelsService);
  const videoRepository = app.get<Repository<Video>>(getRepositoryToken(Video));
  const videoProcessingProducer = app.get(VideoProcessingProducer);
  const storageCfg = app.get<ConfigType<typeof storageConfig>>(
    storageConfig.KEY,
  );

  return new Server({
    path: '/videos/upload',
    datastore: new S3Store({
      s3ClientConfig: {
        bucket: storageCfg.minioBucket,
        endpoint: `http://${storageCfg.minioEndpoint}:${storageCfg.minioPort}`,
        forcePathStyle: true,
        region: 'us-east-1',
        credentials: {
          accessKeyId: storageCfg.minioAccessKey,
          secretAccessKey: storageCfg.minioSecretKey,
        },
      },
    }),
    onIncomingRequest: async (req) => {
      const tusReq = req as TusRequest;
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
        throw unauthorizedError();
      }

      const token = authHeader.slice(BEARER_PREFIX.length);
      let payload: JwtPayload;
      try {
        payload = await jwtService.verifyAsync<JwtPayload>(token);
      } catch {
        throw unauthorizedError();
      }
      tusReq.userId = payload.sub;

      const uploadLength = req.headers['upload-length'];
      if (typeof uploadLength === 'string') {
        const uploadLengthBytes = Number.parseInt(uploadLength, 10);
        if (uploadLengthBytes > MAX_UPLOAD_SIZE_BYTES) {
          throw new TusHookError(
            400,
            'UPLOAD_FILE_TOO_LARGE',
            'Upload exceeds the maximum allowed size of 10GB',
          );
        }
      }
    },
    onUploadCreate: async (req, res, upload) => {
      const userId = (req as TusRequest).userId as string;
      const channel = await channelsService.findByUserId(userId);
      if (!channel) {
        throw new TusHookError(
          403,
          'FORBIDDEN',
          'Authenticated user has no channel',
        );
      }

      const publicId = nanoid(10);
      await videoRepository.save(
        videoRepository.create({
          public_id: publicId,
          channel_id: channel.id,
          title: upload.metadata?.title || 'Untitled',
          description: upload.metadata?.description ?? null,
          status: VideoStatus.DRAFT,
          upload_id: upload.id,
          mime_type: upload.metadata?.filetype ?? null,
          file_size_bytes: upload.size ?? null,
        }),
      );

      res.setHeader('X-Video-Public-Id', publicId);
      return { res };
    },
    onUploadFinish: async (req, res, upload) => {
      const bucket = upload.storage?.bucket ?? storageCfg.minioBucket;
      const key = upload.storage?.path ?? upload.id;

      await videoRepository.update(
        { upload_id: upload.id },
        { storage_bucket: bucket, storage_key: key },
      );

      const video = await videoRepository.findOne({
        where: { upload_id: upload.id },
      });
      if (video) {
        await videoProcessingProducer.enqueueProcessing(video.id, bucket, key);
      }

      return { res };
    },
  });
}

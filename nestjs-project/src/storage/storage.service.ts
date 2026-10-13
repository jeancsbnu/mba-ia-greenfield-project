import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import storageConfig from '../config/storage.config';

export interface GetPresignedUrlOptions {
  expiresInSeconds?: number;
  responseContentDisposition?: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly client: S3Client;
  // Só para assinar URLs: o host interno (`minio:9000`) não é alcançável pelo
  // navegador, então a stack de produção assina com o endereço com que o Caddy
  // serve o storage. Sem `publicUrl`, assina com o client interno, como no dev
  // (testes-producao/TD-05).
  private readonly signingClient: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {
    this.client = this.createClient(
      `http://${this.config.minioEndpoint}:${this.config.minioPort}`,
    );
    this.signingClient = this.config.publicUrl
      ? this.createClient(this.config.publicUrl)
      : this.client;
  }

  private createClient(endpoint: string): S3Client {
    return new S3Client({
      endpoint,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.minioAccessKey,
        secretAccessKey: this.config.minioSecretKey,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.ensureBucketExists(this.config.minioBucket);
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
    }
  }

  async putObject(
    bucket: string,
    key: string,
    body: Buffer | Uint8Array | string,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getPresignedUrl(
    bucket: string,
    key: string,
    options: GetPresignedUrlOptions = {},
  ): Promise<string> {
    const { expiresInSeconds = 300, responseContentDisposition } = options;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(responseContentDisposition && {
        ResponseContentDisposition: responseContentDisposition,
      }),
    });
    return getSignedUrl(this.signingClient, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async downloadToFile(
    bucket: string,
    key: string,
    destinationPath: string,
  ): Promise<void> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    await pipeline(
      response.Body as Readable,
      createWriteStream(destinationPath),
    );
  }

  async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }
}

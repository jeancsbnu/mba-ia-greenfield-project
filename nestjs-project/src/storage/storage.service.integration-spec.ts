import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import storageConfig from '../config/storage.config';
import { StorageModule } from './storage.module';
import { StorageService } from './storage.service';

describe('StorageService (integration)', () => {
  let storageService: StorageService;
  let bucket: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [storageConfig] }),
        StorageModule,
      ],
    }).compile();
    await module.init();

    storageService = module.get(StorageService);
    bucket = storageConfig().minioBucket;
  });

  function objectKey(name: string): string {
    return `test/${name}-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
  }

  it('uploads an object and returns a presigned URL that serves its content', async () => {
    const key = objectKey('upload-get-presign');
    await storageService.putObject(
      bucket,
      key,
      'hello streamtube',
      'text/plain',
    );

    const url = await storageService.getPresignedUrl(bucket, key);
    const response = await fetch(url);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello streamtube');
  });

  it('expires the presigned URL after the configured time', async () => {
    const key = objectKey('expiry');
    await storageService.putObject(bucket, key, 'expiring content');

    const url = await storageService.getPresignedUrl(bucket, key, {
      expiresInSeconds: 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const response = await fetch(url);
    expect(response.status).not.toBe(200);
  });

  it('deletes an object so a subsequent get returns not-found', async () => {
    const key = objectKey('delete');
    await storageService.putObject(bucket, key, 'to be deleted');

    await storageService.deleteObject(bucket, key);

    const url = await storageService.getPresignedUrl(bucket, key);
    const response = await fetch(url);

    expect(response.status).toBe(404);
  });
});

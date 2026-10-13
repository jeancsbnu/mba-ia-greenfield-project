import { Test } from '@nestjs/testing';
import type { ConfigType } from '@nestjs/config';
import storageConfig from '../config/storage.config';
import { StorageService } from './storage.service';

type StorageConfig = ConfigType<typeof storageConfig>;

const baseConfig: StorageConfig = {
  minioEndpoint: 'minio',
  minioPort: 9000,
  minioAccessKey: 'access-key',
  minioSecretKey: 'secret-key',
  minioBucket: 'videos',
  publicUrl: undefined,
};

// A assinatura de URL é um cálculo local (sem rede), então o service é montado
// sem `init()`: o `onModuleInit` que cria o bucket não roda.
async function buildService(config: StorageConfig): Promise<StorageService> {
  const module = await Test.createTestingModule({
    providers: [
      StorageService,
      { provide: storageConfig.KEY, useValue: config },
    ],
  }).compile();
  return module.get(StorageService);
}

describe('StorageService — getPresignedUrl', () => {
  it('signs with the public URL host when publicUrl is configured', async () => {
    const service = await buildService({
      ...baseConfig,
      publicUrl: 'http://localhost:9100',
    });

    const url = new URL(await service.getPresignedUrl('videos', 'a/b.mp4'));

    expect(url.origin).toBe('http://localhost:9100');
    expect(url.pathname).toBe('/videos/a/b.mp4');
    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy();
  });

  it('signs with the internal endpoint when publicUrl is not configured', async () => {
    const service = await buildService(baseConfig);

    const url = new URL(await service.getPresignedUrl('videos', 'a/b.mp4'));

    expect(url.origin).toBe('http://minio:9000');
    expect(url.pathname).toBe('/videos/a/b.mp4');
  });
});

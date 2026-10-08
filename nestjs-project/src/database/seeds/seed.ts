import storageConfig from '../../config/storage.config';
import { StorageService } from '../../storage/storage.service';
import { AppDataSource } from '../data-source';
import { SEED_PASSWORD, SEED_USERS } from './dev-seed.data';
import { seedDevData } from './dev-seed';
import { createFfmpegRenderer } from './dev-seed-media';

async function runSeed(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'O seed de desenvolvimento não roda com NODE_ENV=production',
    );
  }

  await AppDataSource.initialize();
  console.log(
    `Database connection initialized (${String(AppDataSource.options.database)})`,
  );

  try {
    const config = storageConfig();
    const storage = new StorageService(config);
    await storage.onModuleInit();

    const result = await seedDevData(AppDataSource, storage, {
      bucket: config.minioBucket,
      renderMedia: createFfmpegRenderer({ size: '640x360', rate: 25 }),
      log: (message) => console.log(message),
    });

    if (result.status === 'skipped') {
      console.log(
        'Seed já aplicado: as contas do seed existem. Nada foi alterado.',
      );
      return;
    }
    console.log(
      `Seed aplicado: ${result.users} contas, ${result.videos} vídeos, ` +
        `${result.comments} comentários, ${result.subscriptions} inscrições.`,
    );
    console.log(
      `Login: ${SEED_USERS.map((user) => user.email).join(', ')} ` +
        `(senha "${SEED_PASSWORD}")`,
    );
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
}

runSeed().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

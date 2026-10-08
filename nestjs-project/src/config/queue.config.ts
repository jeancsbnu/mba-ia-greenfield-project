import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  // Índice lógico do Redis. O dev usa 0; as suítes de teste usam outro
  // (REDIS_TEST_DB) para não enfileirar nem drenar jobs da fila do dev.
  redisDb: parseInt(process.env.REDIS_DB || '0', 10),
}));

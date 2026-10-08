import { resolveTestDatabaseName } from './test-database-name';
import {
  resolveTestBucket,
  resolveTestRedisDb,
} from './test-queue-and-storage';

// setupFiles do Jest (roda depois de dotenv/config em cada arquivo de teste):
// aponta banco, fila e bucket para os recursos de teste, então o AppModule das
// suítes e2e e os módulos montados nas de integração nunca tocam os do dev. O
// process.env aqui é a cópia do sandbox do arquivo, não o do processo pai —
// por isso os resolvedores enxergam sempre os valores originais do dev.
const redisDb = resolveTestRedisDb();
const bucket = resolveTestBucket();
process.env.DB_NAME = resolveTestDatabaseName();
process.env.REDIS_DB = String(redisDb);
process.env.MINIO_BUCKET = bucket;

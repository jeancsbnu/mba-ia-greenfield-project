import 'dotenv/config';
import {
  ensureTestDatabaseExists,
  migrateFreshTestDatabase,
} from './test-database';
import {
  resolveTestBucket,
  resolveTestRedisDb,
} from './test-queue-and-storage';

// globalSetup do Jest (unit/integração e e2e): roda uma vez por execução,
// antes de qualquer arquivo. Cria o banco de teste se ainda não existir e o
// recria a partir das migrations, para que cada execução comece do mesmo
// schema que o `migration:run` produz no banco de desenvolvimento.
export default async function globalSetup(): Promise<void> {
  // Falha antes de qualquer arquivo se a fila ou o bucket de teste coincidirem
  // com os do dev; o setupFiles repetiria o erro uma vez por arquivo.
  resolveTestRedisDb();
  resolveTestBucket();
  await ensureTestDatabaseExists();
  await migrateFreshTestDatabase();
}

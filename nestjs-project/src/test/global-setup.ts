import 'dotenv/config';
import {
  ensureTestDatabaseExists,
  migrateFreshTestDatabase,
} from './test-database';

// globalSetup do Jest (unit/integração e e2e): roda uma vez por execução,
// antes de qualquer arquivo. Cria o banco de teste se ainda não existir e o
// recria a partir das migrations, para que cada execução comece do mesmo
// schema que o `migration:run` produz no banco de desenvolvimento.
export default async function globalSetup(): Promise<void> {
  await ensureTestDatabaseExists();
  await migrateFreshTestDatabase();
}

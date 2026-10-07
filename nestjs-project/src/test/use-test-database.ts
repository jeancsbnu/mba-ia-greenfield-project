import { resolveTestDatabaseName } from './test-database-name';

// setupFiles do Jest (roda depois de dotenv/config em cada arquivo de teste):
// o AppModule das suítes e2e lê o banco de DB_NAME, então ele passa a apontar
// para o banco de teste. O process.env aqui é a cópia do sandbox do arquivo,
// não o do processo pai.
process.env.DB_NAME = resolveTestDatabaseName();

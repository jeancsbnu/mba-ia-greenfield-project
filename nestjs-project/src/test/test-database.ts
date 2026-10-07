import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource, type MigrationInterface } from 'typeorm';
import { CreateUsersAndChannels1775687773260 } from '../database/migrations/1775687773260-CreateUsersAndChannels';
import { CreateAuthTokens1777579850478 } from '../database/migrations/1777579850478-CreateAuthTokens';
import { CreateVideos1783384550640 } from '../database/migrations/1783384550640-CreateVideos';
import { AddVideoCategoryVisibilityPublication1790081095939 } from '../database/migrations/1790081095939-AddVideoCategoryVisibilityPublication';
import { CreateSocialInteractions1791249975498 } from '../database/migrations/1791249975498-CreateSocialInteractions';
import { resolveTestDatabaseName } from './test-database-name';

// Import explícito porque o ts-jest não resolve o glob de migrations do
// TypeORM de forma confiável (.claude/rules/typeorm-migrations.md).
// assertAllMigrationsListed() falha se uma migration nova ficar de fora.
export const ALL_MIGRATIONS: (new () => MigrationInterface)[] = [
  CreateUsersAndChannels1775687773260,
  CreateAuthTokens1777579850478,
  CreateVideos1783384550640,
  AddVideoCategoryVisibilityPublication1790081095939,
  CreateSocialInteractions1791249975498,
];

const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations');

const DUPLICATE_DATABASE = '42P04';

export function testConnectionOptions() {
  return {
    host: process.env.DB_HOST ?? 'db',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'streamtube',
    password: process.env.DB_PASSWORD ?? 'streamtube',
  };
}

export function assertAllMigrationsListed(): void {
  // 1775687773260-CreateUsersAndChannels.ts → CreateUsersAndChannels1775687773260
  const onDisk = readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+-\w+\.ts$/.test(file))
    .map((file) => {
      const [timestamp, name] = file.replace(/\.ts$/, '').split('-');
      return `${name}${timestamp}`;
    });
  const listed = new Set(ALL_MIGRATIONS.map((migration) => migration.name));
  const missing = onDisk.filter((name) => !listed.has(name));
  if (missing.length > 0) {
    throw new Error(
      `Migrations fora de ALL_MIGRATIONS (src/test/test-database.ts): ${missing.join(', ')}`,
    );
  }
}

export async function ensureTestDatabaseExists(
  database = resolveTestDatabaseName(),
): Promise<void> {
  // CREATE DATABASE não roda dentro do banco que cria: conecta no "postgres",
  // que toda instalação tem.
  const maintenance = new DataSource({
    type: 'postgres',
    ...testConnectionOptions(),
    database: 'postgres',
  });
  await maintenance.initialize();
  try {
    const existing = await maintenance.query<unknown[]>(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (existing.length === 0) {
      await maintenance.query(`CREATE DATABASE "${database}"`);
    }
  } catch (error) {
    // Outra execução criou o banco entre o SELECT e o CREATE.
    const code = (error as { driverError?: { code?: string } }).driverError
      ?.code;
    if (code !== DUPLICATE_DATABASE) throw error;
  } finally {
    await maintenance.destroy();
  }
}

// Apaga tudo do schema public — tabelas, tipos enum e a tabela "migrations" —
// para que nenhum resíduo de synchronize ou de migration desfeita sobreviva.
// O CASCADE leva junto a extensão uuid-ossp, que as migrations usam
// (uuid_generate_v4) mas não criam: no `migration:run` é o driver do TypeORM
// que a cria ao conectar. Recriá-la aqui reproduz esse estado.
export async function dropTestSchema(dataSource: DataSource): Promise<void> {
  await dataSource.query('DROP SCHEMA public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
  await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}

// Deixa o banco de teste exatamente no estado que as migrations produzem.
export async function migrateFreshTestDatabase(): Promise<void> {
  assertAllMigrationsListed();
  const dataSource = new DataSource({
    type: 'postgres',
    ...testConnectionOptions(),
    database: resolveTestDatabaseName(),
    migrations: ALL_MIGRATIONS,
    migrationsRun: false,
  });
  await dataSource.initialize();
  try {
    await dropTestSchema(dataSource);
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}

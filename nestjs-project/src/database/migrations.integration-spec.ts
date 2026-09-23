import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Channel } from '../channels/entities/channel.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { CreateUsersAndChannels1775687773260 } from './migrations/1775687773260-CreateUsersAndChannels';
import { CreateAuthTokens1777579850478 } from './migrations/1777579850478-CreateAuthTokens';
import { CreateVideos1783384550640 } from './migrations/1783384550640-CreateVideos';
import { AddVideoCategoryVisibilityPublication1790081095939 } from './migrations/1790081095939-AddVideoCategoryVisibilityPublication';
import { createTestDataSource } from '../test/create-test-data-source';
import { Video } from '../videos/entities/video.entity';

const MANAGED_TABLES = [
  'users',
  'channels',
  'refresh_tokens',
  'verification_tokens',
];

describe('Database migrations (integration)', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource(
      [User, Channel, RefreshToken, VerificationToken, Video],
      {
        synchronize: false,
        migrations: [
          CreateUsersAndChannels1775687773260,
          CreateAuthTokens1777579850478,
        ],
      },
    );

    await dataSource.initialize();

    await Promise.all([
      ...MANAGED_TABLES.map((table) =>
        dataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE`),
      ),
      dataSource.query(`DROP TABLE IF EXISTS "migrations" CASCADE`),
    ]);

    // DROP TABLE ... CASCADE removes objects that depend on the table (FKs,
    // views) — it does NOT drop a column's enum TYPE, since the dependency
    // runs the other way (table depends on the type). Drop it explicitly,
    // strictly after the table drop above has committed, so re-running
    // CreateAuthTokens' up() (CREATE TYPE) is idempotent regardless of what
    // state the shared dev DB was in before.
    await dataSource.query(
      `DROP TYPE IF EXISTS "public"."verification_tokens_type_enum"`,
    );
  });

  afterAll(async () => {
    // The second test undoes the last migration, leaving token tables missing.
    // Re-apply so the shared DB is fully migrated when subsequent suites run.
    await dataSource.runMigrations();
    await dataSource.destroy();
  });

  it('should apply all migrations and create all four tables', async () => {
    const ranMigrations = await dataSource.runMigrations();

    expect(ranMigrations).toHaveLength(2);

    const result = await dataSource.query<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])
       ORDER BY table_name`,
      [MANAGED_TABLES],
    );
    const tableNames = result.map((r) => r.table_name);
    expect(tableNames).toEqual([
      'channels',
      'refresh_tokens',
      'users',
      'verification_tokens',
    ]);
  });

  it('should revert the last migration and remove token tables', async () => {
    await dataSource.undoLastMigration();

    const result = await dataSource.query<{ table_name: string }[]>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = ANY($1::text[])`,
      [['refresh_tokens', 'verification_tokens']],
    );
    expect(result).toHaveLength(0);
  });
});

describe('AddVideoCategoryVisibilityPublication migration (integration)', () => {
  let dataSource: DataSource;

  const NEW_COLUMNS = [
    'category',
    'comments_count',
    'custom_thumbnail_key',
    'likes_count',
    'published_at',
    'views_count',
    'visibility',
  ];

  async function columnsOfVideos(): Promise<string[]> {
    const rows = await dataSource.query<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'videos'
         AND column_name = ANY($1::text[])
       ORDER BY column_name`,
      [NEW_COLUMNS],
    );
    return rows.map((row) => row.column_name);
  }

  beforeAll(async () => {
    dataSource = createTestDataSource(
      [User, Channel, RefreshToken, VerificationToken, Video],
      {
        synchronize: false,
        migrations: [
          CreateUsersAndChannels1775687773260,
          CreateAuthTokens1777579850478,
          CreateVideos1783384550640,
          AddVideoCategoryVisibilityPublication1790081095939,
        ],
      },
    );

    await dataSource.initialize();

    for (const table of [...MANAGED_TABLES, 'videos', 'migrations']) {
      await dataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    for (const type of [
      'verification_tokens_type_enum',
      'videos_status_enum',
      'videos_category_enum',
      'videos_visibility_enum',
    ]) {
      await dataSource.query(`DROP TYPE IF EXISTS "public"."${type}"`);
    }
  }, 60000);

  afterAll(async () => {
    // Deixa o banco compartilhado totalmente migrado para as demais suítes.
    await dataSource.runMigrations();
    await dataSource.destroy();
  });

  it('preserves an existing video and applies the new defaults', async () => {
    // Estado anterior à Fase 04: sobe tudo e desfaz a última para ter a tabela
    // `videos` sem as colunas novas.
    await dataSource.runMigrations();
    await dataSource.undoLastMigration();

    expect(await columnsOfVideos()).toEqual([]);

    const [user] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO "users" ("email", "password") VALUES ($1, $2) RETURNING "id"`,
      ['pre_migration@example.com', 'hashed'],
    );
    const [channel] = await dataSource.query<{ id: string }[]>(
      `INSERT INTO "channels" ("name", "nickname", "user_id")
       VALUES ($1, $2, $3) RETURNING "id"`,
      ['Canal anterior', 'canal_anterior', user.id],
    );
    await dataSource.query(
      `INSERT INTO "videos" ("public_id", "channel_id", "title")
       VALUES ($1, $2, $3)`,
      ['pre_mig_1', channel.id, 'Vídeo anterior à Fase 04'],
    );

    await dataSource.runMigrations();

    expect(await columnsOfVideos()).toEqual(NEW_COLUMNS);

    const [migrated] = await dataSource.query<
      {
        title: string;
        category: string;
        visibility: string;
        published_at: Date | null;
        custom_thumbnail_key: string | null;
        views_count: number;
        likes_count: number;
        comments_count: number;
      }[]
    >(`SELECT * FROM "videos" WHERE "public_id" = $1`, ['pre_mig_1']);

    expect(migrated.title).toBe('Vídeo anterior à Fase 04');
    expect(migrated.category).toBe('Outros');
    expect(migrated.visibility).toBe('public');
    expect(migrated.published_at).toBeNull();
    expect(migrated.custom_thumbnail_key).toBeNull();
    expect(migrated.views_count).toBe(0);
    expect(migrated.likes_count).toBe(0);
    expect(migrated.comments_count).toBe(0);
  });

  it('creates the composite index on (channel_id, published_at)', async () => {
    const rows = await dataSource.query<{ indexdef: string }[]>(
      `SELECT indexdef FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'videos'`,
    );

    const composite = rows.find(
      (row) =>
        row.indexdef.includes('channel_id') &&
        row.indexdef.includes('published_at'),
    );
    expect(composite).toBeDefined();
  });

  it('reverts by dropping the columns and the enum types, keeping the video', async () => {
    await dataSource.undoLastMigration();

    expect(await columnsOfVideos()).toEqual([]);

    const types = await dataSource.query<{ typname: string }[]>(
      `SELECT typname FROM pg_type
       WHERE typname = ANY($1::text[])`,
      [['videos_category_enum', 'videos_visibility_enum']],
    );
    expect(types).toHaveLength(0);

    const [kept] = await dataSource.query<{ title: string }[]>(
      `SELECT "title" FROM "videos" WHERE "public_id" = $1`,
      ['pre_mig_1'],
    );
    expect(kept.title).toBe('Vídeo anterior à Fase 04');
  });
});

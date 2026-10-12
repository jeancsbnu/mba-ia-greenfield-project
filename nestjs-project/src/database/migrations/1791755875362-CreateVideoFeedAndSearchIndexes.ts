import { MigrationInterface, QueryRunner } from 'typeorm';

// Índices da listagem global e da busca (home-busca/TD-03 e TD-04). Escrita à
// mão porque o CLI não gera extensões, funções nem índices de expressão.
// O unaccent() é STABLE; índice de expressão exige IMMUTABLE, daí o wrapper com
// o dicionário qualificado por schema. O nickname já é [a-z0-9_] (phase-02-auth/
// TD-10), então o índice dele dispensa lower() e unaccent.
export class CreateVideoFeedAndSearchIndexes1791755875362 implements MigrationInterface {
  name = 'CreateVideoFeedAndSearchIndexes1791755875362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
    await queryRunner.query(
      `CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text
       LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
       AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "videos_title_search_idx" ON "videos" USING GIN (public.immutable_unaccent(lower("title")) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "channels_name_search_idx" ON "channels" USING GIN (public.immutable_unaccent(lower("name")) gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "channels_nickname_search_idx" ON "channels" USING GIN ("nickname" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "videos_listable_published_idx" ON "videos" ("published_at" DESC, "id" DESC) WHERE "published_at" IS NOT NULL AND "visibility" = 'public'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."videos_listable_published_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."channels_nickname_search_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."channels_name_search_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."videos_title_search_idx"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS public.immutable_unaccent(text)`,
    );
    await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}

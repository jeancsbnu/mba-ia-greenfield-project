import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVideoCategoryVisibilityPublication1790081095939 implements MigrationInterface {
  name = 'AddVideoCategoryVisibilityPublication1790081095939';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."videos_category_enum" AS ENUM('Música', 'Jogos', 'Educação', 'Entretenimento', 'Notícias', 'Esportes', 'Tecnologia', 'Outros')`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "category" "public"."videos_category_enum" NOT NULL DEFAULT 'Outros'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."videos_visibility_enum" AS ENUM('public', 'unlisted')`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "visibility" "public"."videos_visibility_enum" NOT NULL DEFAULT 'public'`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "published_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "custom_thumbnail_key" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "views_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "likes_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" ADD "comments_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a27e09cf23ef046fb480d94d97" ON "videos" ("channel_id", "published_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a27e09cf23ef046fb480d94d97"`,
    );
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN "comments_count"`,
    );
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "likes_count"`);
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "views_count"`);
    await queryRunner.query(
      `ALTER TABLE "videos" DROP COLUMN "custom_thumbnail_key"`,
    );
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "published_at"`);
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "visibility"`);
    await queryRunner.query(`DROP TYPE "public"."videos_visibility_enum"`);
    await queryRunner.query(`ALTER TABLE "videos" DROP COLUMN "category"`);
    await queryRunner.query(`DROP TYPE "public"."videos_category_enum"`);
  }
}

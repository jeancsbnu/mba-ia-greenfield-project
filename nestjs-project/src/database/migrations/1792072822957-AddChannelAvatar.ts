import { MigrationInterface, QueryRunner } from 'typeorm';

// Foto de perfil do canal: só a chave do objeto no storage; nula = iniciais.
export class AddChannelAvatar1792072822957 implements MigrationInterface {
  name = 'AddChannelAvatar1792072822957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "channels" ADD COLUMN IF NOT EXISTS "avatar_key" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "channels" DROP COLUMN IF EXISTS "avatar_key"`,
    );
  }
}

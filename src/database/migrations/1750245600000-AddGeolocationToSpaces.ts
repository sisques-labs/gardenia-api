import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeolocationToSpaces1750245600000 implements MigrationInterface {
  name = 'AddGeolocationToSpaces1750245600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "environment" VARCHAR(10) NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP COLUMN IF EXISTS "environment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP COLUMN IF EXISTS "longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP COLUMN IF EXISTS "latitude"`,
    );
  }
}

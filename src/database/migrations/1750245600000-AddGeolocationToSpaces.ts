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
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD CONSTRAINT "CHK_spaces_latitude" CHECK (latitude >= -90 AND latitude <= 90)`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD CONSTRAINT "CHK_spaces_longitude" CHECK (longitude >= -180 AND longitude <= 180)`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" ADD CONSTRAINT "CHK_spaces_environment" CHECK (environment IN ('INDOOR', 'OUTDOOR', 'MIXED'))`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP CONSTRAINT IF EXISTS "CHK_spaces_environment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP CONSTRAINT IF EXISTS "CHK_spaces_longitude"`,
    );
    await queryRunner.query(
      `ALTER TABLE "spaces" DROP CONSTRAINT IF EXISTS "CHK_spaces_latitude"`,
    );
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

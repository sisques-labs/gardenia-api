import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPlantIdFromQrs1780000000008 implements MigrationInterface {
  name = 'DropPlantIdFromQrs1780000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qrs" DROP CONSTRAINT IF EXISTS "UQ_qrs_plant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qrs" DROP COLUMN IF EXISTS "plant_id"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qrs"
      ADD COLUMN "plant_id" uuid
    `);
    await queryRunner.query(
      `ALTER TABLE "qrs" ADD CONSTRAINT "UQ_qrs_plant_id" UNIQUE ("plant_id")`,
    );
  }
}

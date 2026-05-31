import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlantQrForeignKeys1780000000009 implements MigrationInterface {
  name = 'AddPlantQrForeignKeys1780000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qrs"
      ADD COLUMN "plant_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "qrs" q
      SET "plant_id" = p."id"
      FROM "plants" p
      WHERE p."qr_id" = q."id"
    `);

    await queryRunner.query(`
      ALTER TABLE "qrs"
      ADD CONSTRAINT "UQ_qrs_plant_id" UNIQUE ("plant_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "qrs"
      ADD CONSTRAINT "FK_qrs_plant_id"
      FOREIGN KEY ("plant_id") REFERENCES "plants"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_qr_id"
      FOREIGN KEY ("qr_id") REFERENCES "qrs"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_qr_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qrs" DROP CONSTRAINT IF EXISTS "FK_qrs_plant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qrs" DROP CONSTRAINT IF EXISTS "UQ_qrs_plant_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qrs" DROP COLUMN IF EXISTS "plant_id"`,
    );
  }
}

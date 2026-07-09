import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkPlantingSpotsToQrs1780000000023 implements MigrationInterface {
  name = 'LinkPlantingSpotsToQrs1780000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
      ADD COLUMN "qr_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "planting_spots"
      ADD CONSTRAINT "UQ_planting_spots_qr_id" UNIQUE ("qr_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "planting_spots"
      ADD CONSTRAINT "FK_planting_spots_qr_id"
      FOREIGN KEY ("qr_id") REFERENCES "qrs"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "delete_qr_when_planting_spot_deleted"()
      RETURNS TRIGGER AS $$
      BEGIN
        IF OLD."qr_id" IS NOT NULL THEN
          DELETE FROM "qrs" WHERE "id" = OLD."qr_id";
        END IF;
        RETURN OLD;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "TRG_planting_spots_delete_linked_qr"
      BEFORE DELETE ON "planting_spots"
      FOR EACH ROW
      EXECUTE FUNCTION "delete_qr_when_planting_spot_deleted"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TRG_planting_spots_delete_linked_qr" ON "planting_spots"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "delete_qr_when_planting_spot_deleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planting_spots" DROP CONSTRAINT IF EXISTS "FK_planting_spots_qr_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planting_spots" DROP CONSTRAINT IF EXISTS "UQ_planting_spots_qr_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "planting_spots" DROP COLUMN IF EXISTS "qr_id"`,
    );
  }
}

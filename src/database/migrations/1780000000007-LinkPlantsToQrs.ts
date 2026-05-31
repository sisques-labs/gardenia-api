import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkPlantsToQrs1780000000007 implements MigrationInterface {
  name = 'LinkPlantsToQrs1780000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD COLUMN "qr_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "UQ_plants_qr_id" UNIQUE ("qr_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_qr_id"
      FOREIGN KEY ("qr_id") REFERENCES "qrs"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION "delete_qr_when_plant_deleted"()
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
      CREATE TRIGGER "TRG_plants_delete_linked_qr"
      BEFORE DELETE ON "plants"
      FOR EACH ROW
      EXECUTE FUNCTION "delete_qr_when_plant_deleted"()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "TRG_plants_delete_linked_qr" ON "plants"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS "delete_qr_when_plant_deleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_qr_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "UQ_plants_qr_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "plants" DROP COLUMN IF EXISTS "qr_id"`,
    );
  }
}

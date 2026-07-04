import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusAndFallowSinceToPlantingSpots1780000000022 implements MigrationInterface {
  name = 'AddStatusAndFallowSinceToPlantingSpots1780000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
        ADD COLUMN "status" character varying(10) NOT NULL DEFAULT 'active',
        ADD COLUMN "fallow_since" timestamptz NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "fallow_since"
    `);
  }
}

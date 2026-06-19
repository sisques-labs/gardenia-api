import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlantingSpotCapacityAndFields1780000000017
  implements MigrationInterface
{
  name = 'AddPlantingSpotCapacityAndFields1780000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
        ADD COLUMN "capacity" integer NULL,
        ADD COLUMN "spot_row" integer NULL,
        ADD COLUMN "spot_column" integer NULL,
        ADD COLUMN "dimensions" character varying(100) NULL,
        ADD COLUMN "soil_type" character varying(100) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
        DROP COLUMN IF EXISTS "capacity",
        DROP COLUMN IF EXISTS "spot_row",
        DROP COLUMN IF EXISTS "spot_column",
        DROP COLUMN IF EXISTS "dimensions",
        DROP COLUMN IF EXISTS "soil_type"
    `);
  }
}

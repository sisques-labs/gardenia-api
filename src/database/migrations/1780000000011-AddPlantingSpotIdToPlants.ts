import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlantingSpotIdToPlants1780000000011 implements MigrationInterface {
  name = 'AddPlantingSpotIdToPlants1780000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD COLUMN "planting_spot_id" uuid NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      DROP COLUMN "planting_spot_id"
    `);
  }
}

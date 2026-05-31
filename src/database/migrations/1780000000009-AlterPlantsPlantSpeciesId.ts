import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPlantsPlantSpeciesId1780000000009 implements MigrationInterface {
  name = 'AlterPlantsPlantSpeciesId1780000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD COLUMN "plant_species_id" uuid NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      DROP COLUMN "species"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD COLUMN "species" character varying(200) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      DROP COLUMN "plant_species_id"
    `);
  }
}

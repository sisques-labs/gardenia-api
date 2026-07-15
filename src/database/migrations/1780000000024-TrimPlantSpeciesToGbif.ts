import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrimPlantSpeciesToGbif1780000000024 implements MigrationInterface {
  name = 'TrimPlantSpeciesToGbif1780000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP COLUMN "description"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP COLUMN "image_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP CONSTRAINT "UQ_plant_species_scientific_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD COLUMN "gbif_key" integer
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_plant_species_gbif_key" ON "plant_species" ("gbif_key") WHERE "gbif_key" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "UQ_plant_species_gbif_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP COLUMN "gbif_key"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD CONSTRAINT "UQ_plant_species_scientific_name" UNIQUE ("scientific_name")
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD COLUMN "image_url" character varying(500)
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD COLUMN "description" character varying(2000)
    `);
  }
}

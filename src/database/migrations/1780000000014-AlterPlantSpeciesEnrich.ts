import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPlantSpeciesEnrich1780000000014 implements MigrationInterface {
  name = 'AlterPlantSpeciesEnrich1780000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plant_species" RENAME COLUMN "name" TO "scientific_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ALTER COLUMN "scientific_name" TYPE character varying(300)
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" RENAME CONSTRAINT "UQ_plant_species_name" TO "UQ_plant_species_scientific_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD COLUMN "description" character varying(2000)
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ADD COLUMN "image_url" character varying(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP COLUMN "image_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" DROP COLUMN "description"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" RENAME CONSTRAINT "UQ_plant_species_scientific_name" TO "UQ_plant_species_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" ALTER COLUMN "scientific_name" TYPE character varying(200)
    `);
    await queryRunner.query(`
      ALTER TABLE "plant_species" RENAME COLUMN "scientific_name" TO "name"
    `);
  }
}

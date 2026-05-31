import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantSpecies1780000000008 implements MigrationInterface {
  name = 'CreatePlantSpecies1780000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plant_species" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(200) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plant_species_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_plant_species_name" UNIQUE ("name")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plant_species"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantingSpots1780000000010 implements MigrationInterface {
  name = 'CreatePlantingSpots1780000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "planting_spots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "type" character varying(100) NOT NULL,
        "description" character varying(1000) NULL,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_planting_spots_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_planting_spots_space_id" ON "planting_spots" ("space_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_planting_spots_space_id"`);
    await queryRunner.query(`DROP TABLE "planting_spots"`);
  }
}

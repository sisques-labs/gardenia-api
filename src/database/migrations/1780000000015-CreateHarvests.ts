import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHarvests1780000000015 implements MigrationInterface {
  name = 'CreateHarvests1780000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "harvests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "crop_type" character varying(200) NOT NULL,
        "quantity" decimal(10,3) NOT NULL,
        "unit" character varying(50) NOT NULL,
        "harvested_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_harvests_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_harvests_space_id" ON "harvests" ("space_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_harvests_space_id"`);
    await queryRunner.query(`DROP TABLE "harvests"`);
  }
}

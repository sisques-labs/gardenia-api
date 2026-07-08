import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantPhotos1780000000023 implements MigrationInterface {
  name = 'CreatePlantPhotos1780000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plant_photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plant_id" uuid NOT NULL,
        "file_id" uuid NOT NULL,
        "url" character varying(1024) NOT NULL,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plant_photos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plant_photos_file_id" FOREIGN KEY ("file_id")
          REFERENCES "files" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_photos_space_id" ON "plant_photos" ("space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_photos_plant_id_space_id" ON "plant_photos" ("plant_id", "space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_photos_plant_id_space_id_created_at" ON "plant_photos" ("plant_id", "space_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_plant_photos_plant_id_space_id_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_plant_photos_plant_id_space_id"`);
    await queryRunner.query(`DROP INDEX "IDX_plant_photos_space_id"`);
    await queryRunner.query(`DROP TABLE "plant_photos"`);
  }
}

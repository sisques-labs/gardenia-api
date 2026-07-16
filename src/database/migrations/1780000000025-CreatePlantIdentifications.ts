import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlantIdentifications1780000000025 implements MigrationInterface {
  name = 'CreatePlantIdentifications1780000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plant_identifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "requested_by_user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "status" character varying NOT NULL,
        "resolved_species_key" integer,
        "resolved_scientific_name" character varying(300),
        "resolved_species_provider" character varying(50),
        "converted_to_plant_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plant_identifications_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_identifications_space_id" ON "plant_identifications" ("space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_identifications_space_id_requested_by_user_id_created_at" ON "plant_identifications" ("space_id", "requested_by_user_id", "created_at" DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE "plant_identification_photos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plant_identification_id" uuid NOT NULL,
        "file_id" uuid NOT NULL,
        "url" character varying(1024) NOT NULL,
        "organ" character varying NOT NULL,
        "position" smallint NOT NULL,
        CONSTRAINT "PK_plant_identification_photos_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plant_identification_photos_plant_identification_id" FOREIGN KEY ("plant_identification_id")
          REFERENCES "plant_identifications" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_identification_photos_plant_identification_id" ON "plant_identification_photos" ("plant_identification_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "plant_identification_candidates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plant_identification_id" uuid NOT NULL,
        "scientific_name" character varying(300) NOT NULL,
        "score" numeric(5,4) NOT NULL,
        "rank" smallint NOT NULL,
        CONSTRAINT "PK_plant_identification_candidates_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plant_identification_candidates_plant_identification_id" FOREIGN KEY ("plant_identification_id")
          REFERENCES "plant_identifications" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_identification_candidates_plant_identification_id" ON "plant_identification_candidates" ("plant_identification_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "plant_identification_candidate_common_names" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "candidate_id" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "position" smallint NOT NULL,
        CONSTRAINT "PK_plant_identification_candidate_common_names_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_plant_identification_candidate_common_names_candidate_id" FOREIGN KEY ("candidate_id")
          REFERENCES "plant_identification_candidates" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_plant_identification_candidate_common_names_candidate_id" ON "plant_identification_candidate_common_names" ("candidate_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_plant_identification_candidate_common_names_candidate_id"`,
    );
    await queryRunner.query(
      `DROP TABLE "plant_identification_candidate_common_names"`,
    );

    await queryRunner.query(
      `DROP INDEX "IDX_plant_identification_candidates_plant_identification_id"`,
    );
    await queryRunner.query(`DROP TABLE "plant_identification_candidates"`);

    await queryRunner.query(
      `DROP INDEX "IDX_plant_identification_photos_plant_identification_id"`,
    );
    await queryRunner.query(`DROP TABLE "plant_identification_photos"`);

    await queryRunner.query(
      `DROP INDEX "IDX_plant_identifications_space_id_requested_by_user_id_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_plant_identifications_space_id"`);
    await queryRunner.query(`DROP TABLE "plant_identifications"`);
  }
}

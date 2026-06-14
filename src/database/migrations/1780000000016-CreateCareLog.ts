import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCareLog1780000000016 implements MigrationInterface {
  name = 'CreateCareLog1780000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "care_log_entries" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "activity_type" character varying(32) NOT NULL,
        "performed_at" TIMESTAMPTZ NOT NULL,
        "notes" text NULL,
        "quantity" decimal(10,3) NULL,
        "unit" character varying(8) NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_care_log_entries_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_care_log_entries_space_id" ON "care_log_entries" ("space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_care_log_entries_plant_id_space_id" ON "care_log_entries" ("plant_id", "space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_care_log_entries_performed_at" ON "care_log_entries" ("plant_id", "space_id", "performed_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_care_log_entries_performed_at"`);
    await queryRunner.query(
      `DROP INDEX "IDX_care_log_entries_plant_id_space_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_care_log_entries_space_id"`);
    await queryRunner.query(`DROP TABLE "care_log_entries"`);
  }
}

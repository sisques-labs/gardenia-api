import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCareSchedules1780000000020 implements MigrationInterface {
  name = 'CreateCareSchedules1780000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "care_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plant_id" uuid NOT NULL,
        "activity_type" character varying(32) NOT NULL,
        "interval_days" integer NOT NULL,
        "quantity" decimal(10,3),
        "unit" character varying(8),
        "notes" text,
        "next_due_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "last_completed_at" TIMESTAMP WITH TIME ZONE,
        "active" boolean NOT NULL DEFAULT true,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_care_schedules_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_care_schedules_space_id" ON "care_schedules" ("space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_care_schedules_plant_id_space_id" ON "care_schedules" ("plant_id", "space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_care_schedules_due" ON "care_schedules" ("space_id", "active", "next_due_at")
    `);

    await queryRunner.query(`
      ALTER TABLE "care_schedules"
      ADD CONSTRAINT "FK_care_schedules_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "care_schedules"
      ADD CONSTRAINT "FK_care_schedules_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "care_schedules" DROP CONSTRAINT IF EXISTS "FK_care_schedules_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "care_schedules" DROP CONSTRAINT IF EXISTS "FK_care_schedules_space_id"
    `);
    await queryRunner.query(`DROP INDEX "IDX_care_schedules_due"`);
    await queryRunner.query(
      `DROP INDEX "IDX_care_schedules_plant_id_space_id"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_care_schedules_space_id"`);
    await queryRunner.query(`DROP TABLE "care_schedules"`);
  }
}

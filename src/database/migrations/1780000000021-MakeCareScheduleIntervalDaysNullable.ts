import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCareScheduleIntervalDaysNullable1780000000021 implements MigrationInterface {
  name = 'MakeCareScheduleIntervalDaysNullable1780000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // A care schedule can now be recurring (interval_days set) or one-time for
    // a specific day (interval_days NULL).
    await queryRunner.query(`
      ALTER TABLE "care_schedules" ALTER COLUMN "interval_days" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Backfill one-time schedules with a sane default before restoring NOT NULL.
    await queryRunner.query(`
      UPDATE "care_schedules" SET "interval_days" = 1 WHERE "interval_days" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "care_schedules" ALTER COLUMN "interval_days" SET NOT NULL
    `);
  }
}

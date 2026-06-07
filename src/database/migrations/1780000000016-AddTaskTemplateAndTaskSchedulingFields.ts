import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTaskTemplateAndTaskSchedulingFields1780000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE task_templates
        ADD COLUMN default_cron_expression VARCHAR(100) NULL,
        ADD COLUMN default_is_recurring BOOLEAN NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE tasks
        ADD COLUMN target_type VARCHAR(50) NULL,
        ADD COLUMN target_id UUID NULL,
        ADD COLUMN valid_from TIMESTAMPTZ NULL,
        ADD COLUMN valid_until TIMESTAMPTZ NULL
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_tasks_target_id ON tasks(target_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_tasks_target_id`);

    await queryRunner.query(`
      ALTER TABLE tasks
        DROP COLUMN valid_until,
        DROP COLUMN valid_from,
        DROP COLUMN target_id,
        DROP COLUMN target_type
    `);

    await queryRunner.query(`
      ALTER TABLE task_templates
        DROP COLUMN default_is_recurring,
        DROP COLUMN default_cron_expression
    `);
  }
}

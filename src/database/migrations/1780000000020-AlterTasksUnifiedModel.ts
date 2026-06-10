import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTasksUnifiedModel1780000000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tasks
        ALTER COLUMN task_template_id DROP NOT NULL,
        ADD COLUMN trigger_type VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        ADD COLUMN title VARCHAR(255),
        ADD COLUMN description TEXT
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_tasks_trigger_type ON tasks (trigger_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_tasks_trigger_type`);

    await queryRunner.query(`
      ALTER TABLE tasks
        ALTER COLUMN task_template_id SET NOT NULL,
        DROP COLUMN trigger_type,
        DROP COLUMN title,
        DROP COLUMN description
    `);
  }
}

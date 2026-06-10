import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTasksTable1780000000018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE user_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        scheduled_date TIMESTAMPTZ NOT NULL,
        task_template_id UUID,
        user_id UUID NOT NULL,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_tasks_user_id ON user_tasks (user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_tasks_task_template_id ON user_tasks (task_template_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_tasks_scheduled_date ON user_tasks (scheduled_date)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_user_tasks_user_scheduled ON user_tasks (user_id, scheduled_date)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE user_tasks`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasks1780000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_template_id UUID NOT NULL REFERENCES task_templates(id),
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        payload JSONB NOT NULL DEFAULT '{}',
        priority SMALLINT NOT NULL DEFAULT 5,
        delay_ms INTEGER,
        cron_expression VARCHAR(100),
        is_recurring BOOLEAN NOT NULL DEFAULT false,
        max_runs INTEGER,
        run_count INTEGER NOT NULL DEFAULT 0,
        idempotency_key VARCHAR(255) UNIQUE,
        queue_job_id VARCHAR(255),
        user_id UUID NOT NULL,
        scheduled_at TIMESTAMPTZ,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        failed_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IDX_tasks_status ON tasks(status)`);
    await queryRunner.query(`CREATE INDEX IDX_tasks_user_id ON tasks(user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_tasks_user_id`);
    await queryRunner.query(`DROP INDEX IDX_tasks_status`);
    await queryRunner.query(`DROP TABLE tasks`);
  }
}

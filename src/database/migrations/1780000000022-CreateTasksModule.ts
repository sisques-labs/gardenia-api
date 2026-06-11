import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTasksModule1780000000022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE task_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        handler_key VARCHAR(255),
        default_priority SMALLINT NOT NULL DEFAULT 5,
        default_retry_count SMALLINT NOT NULL DEFAULT 3,
        default_backoff_strategy VARCHAR(20) NOT NULL DEFAULT 'exponential',
        default_timeout_ms INTEGER NOT NULL DEFAULT 30000,
        max_concurrency SMALLINT NOT NULL DEFAULT 5,
        user_id UUID NOT NULL,
        default_cron_expression VARCHAR(100),
        default_is_recurring BOOLEAN NOT NULL DEFAULT false,
        task_title VARCHAR(255),
        task_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_template_id UUID REFERENCES task_templates(id),
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
        target_type VARCHAR(50),
        target_id UUID,
        valid_from TIMESTAMPTZ,
        valid_until TIMESTAMPTZ,
        trigger_type VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        title VARCHAR(255),
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IDX_tasks_status ON tasks(status)`);
    await queryRunner.query(`CREATE INDEX IDX_tasks_user_id ON tasks(user_id)`);
    await queryRunner.query(
      `CREATE INDEX IDX_tasks_target_id ON tasks(target_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IDX_tasks_trigger_type ON tasks(trigger_type)`,
    );

    await queryRunner.query(`
      CREATE TABLE task_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id UUID NOT NULL REFERENCES tasks(id),
        attempt SMALLINT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL,
        progress SMALLINT NOT NULL DEFAULT 0,
        error TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ended_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IDX_task_runs_task_id ON task_runs(task_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_task_runs_task_id`);
    await queryRunner.query(`DROP TABLE task_runs`);

    await queryRunner.query(`DROP INDEX IDX_tasks_trigger_type`);
    await queryRunner.query(`DROP INDEX IDX_tasks_target_id`);
    await queryRunner.query(`DROP INDEX IDX_tasks_user_id`);
    await queryRunner.query(`DROP INDEX IDX_tasks_status`);
    await queryRunner.query(`DROP TABLE tasks`);

    await queryRunner.query(`DROP TABLE task_templates`);
  }
}

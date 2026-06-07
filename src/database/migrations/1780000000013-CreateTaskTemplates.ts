import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskTemplates1780000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE task_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        handler_key VARCHAR(255) NOT NULL,
        default_priority SMALLINT NOT NULL DEFAULT 5,
        default_retry_count SMALLINT NOT NULL DEFAULT 3,
        default_backoff_strategy VARCHAR(20) NOT NULL DEFAULT 'exponential',
        default_timeout_ms INTEGER NOT NULL DEFAULT 30000,
        max_concurrency SMALLINT NOT NULL DEFAULT 5,
        user_id UUID NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE task_templates`);
  }
}

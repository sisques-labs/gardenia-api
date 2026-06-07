import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaskRuns1780000000015 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`CREATE INDEX IDX_task_runs_task_id ON task_runs(task_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_task_runs_task_id`);
    await queryRunner.query(`DROP TABLE task_runs`);
  }
}

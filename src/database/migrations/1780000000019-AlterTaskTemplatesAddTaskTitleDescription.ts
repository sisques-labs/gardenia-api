import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterTaskTemplatesAddTaskTitleDescription1780000000019 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE task_templates
        ADD COLUMN task_title VARCHAR(255),
        ADD COLUMN task_description TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE task_templates
        DROP COLUMN task_title,
        DROP COLUMN task_description
    `);
  }
}

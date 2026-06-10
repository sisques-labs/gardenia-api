import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeTaskTemplateHandlerKeyNullable1780000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE task_templates
        ALTER COLUMN handler_key DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE task_templates SET handler_key = '' WHERE handler_key IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE task_templates
        ALTER COLUMN handler_key SET NOT NULL
    `);
  }
}

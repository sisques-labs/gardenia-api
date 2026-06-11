import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppRoleToAccounts1780000000014 implements MigrationInterface {
  name = 'AddAppRoleToAccounts1780000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN "app_role" varchar NOT NULL DEFAULT 'user'
      CONSTRAINT "chk_accounts_app_role" CHECK ("app_role" IN ('admin', 'user'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN "app_role"
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExternalSubjectToAccounts1780000000027 implements MigrationInterface {
  name = 'AddExternalSubjectToAccounts1780000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN "external_subject" varchar NULL
    `);

    // Partial + GLOBAL unique index (deliberately NOT scoped by space_id, unlike
    // this table's existing (space_id, email) constraint): a platform subject
    // identifies one human platform-wide. NULLs (never-linked accounts) are
    // excluded so unlimited unlinked rows remain valid.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_accounts_external_subject"
      ON "accounts" ("external_subject")
      WHERE "external_subject" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "UQ_accounts_external_subject"
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP COLUMN "external_subject"
    `);
  }
}

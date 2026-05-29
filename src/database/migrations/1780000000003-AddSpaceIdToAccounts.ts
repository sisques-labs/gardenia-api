import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpaceIdToAccounts1780000000003 implements MigrationInterface {
  name = 'AddSpaceIdToAccounts1780000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing scalar UNIQUE(email) constraint
    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0"
    `);

    // Add space_id column (alpha data discarded — no backfill)
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN "space_id" uuid NOT NULL
    `);

    // Add composite unique constraint on (space_id, email)
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "UQ_accounts_space_id_email" UNIQUE ("space_id", "email")
    `);

    // Add index on space_id for lookup performance
    await queryRunner.query(`
      CREATE INDEX "IDX_accounts_space_id" ON "accounts" ("space_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_accounts_space_id"`);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP CONSTRAINT "UQ_accounts_space_id_email"
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      DROP COLUMN "space_id"
    `);

    // Restore the original scalar UNIQUE(email) constraint
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "UQ_ee66de6cdc53993296d1ceb8aa0" UNIQUE ("email")
    `);
  }
}

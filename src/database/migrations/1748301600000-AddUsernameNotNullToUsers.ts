import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameNotNullToUsers1748301600000
  implements MigrationInterface
{
  name = 'AddUsernameNotNullToUsers1748301600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add username column as nullable (idempotent — skip if already exists)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "username" character varying(30) NULL
    `);

    // Step 2: Backfill username for rows where it is still NULL
    await queryRunner.query(`
      UPDATE "users"
      SET "username" = 'user_' || SUBSTRING(id::text, 1, 8)
      WHERE "username" IS NULL
    `);

    // Step 3: Enforce NOT NULL constraint
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "username" SET NOT NULL
    `);

    // Step 4: Create unique index (idempotent — skip if already exists)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_username_unique"
      ON "users" ("username")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_username_unique"
    `);

    // Revert NOT NULL constraint back to nullable
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "username" DROP NOT NULL
    `);
  }
}

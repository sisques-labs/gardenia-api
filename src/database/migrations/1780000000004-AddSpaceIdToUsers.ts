import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpaceIdToUsers1780000000004 implements MigrationInterface {
  name = 'AddSpaceIdToUsers1780000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing scalar unique index on username
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_users_username_unique"
    `);

    // Add space_id column (alpha data discarded — no backfill)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "space_id" uuid NOT NULL
    `);

    // Add composite unique index on (space_id, username)
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_space_id_username" ON "users" ("space_id", "username")
    `);

    // Add index on space_id for lookup performance
    await queryRunner.query(`
      CREATE INDEX "IDX_users_space_id" ON "users" ("space_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_space_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_space_id_username"`);

    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "space_id"
    `);

    // Restore the original scalar unique index on username
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_username_unique" ON "users" ("username")
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSpaceTenantMapping1780000000028 implements MigrationInterface {
  name = 'AddSpaceTenantMapping1780000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Bridge column for EXISTING spaces (design.md D6). NEW spaces created via
    // the platform-linked path adopt the platform tenant UUID as `space.id`
    // directly (literal parity, no mapping needed) — this column stays NULL
    // for those. Nullable because no existing space has a platform tenant yet
    // and no backfill value exists at migration time.
    await queryRunner.query(`
      ALTER TABLE "spaces"
      ADD COLUMN "external_tenant_id" uuid NULL
    `);

    // Partial + global unique index, mirroring PR1's
    // "UQ_accounts_external_subject" shape: one tenant maps to at most one
    // space, NULLs (non-platform-linked spaces) are excluded so unlimited
    // unlinked rows remain valid.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_spaces_external_tenant_id"
      ON "spaces" ("external_tenant_id")
      WHERE "external_tenant_id" IS NOT NULL
    `);

    // Tracks the last successful reconciliation against account-api's
    // membership API (design.md D4). NULL = "never synced" = treated as
    // stale by the (not-yet-implemented) MembershipProjectionSyncGuard.
    await queryRunner.query(`
      ALTER TABLE "space_memberships"
      ADD COLUMN "synced_at" timestamp NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "space_memberships"
      DROP COLUMN "synced_at"
    `);

    await queryRunner.query(`
      DROP INDEX "UQ_spaces_external_tenant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "spaces"
      DROP COLUMN "external_tenant_id"
    `);
  }
}

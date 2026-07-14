import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1780000000025 implements MigrationInterface {
  name = 'CreateNotifications1780000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" character varying(50) NOT NULL,
        "reference_type" character varying(50) NOT NULL,
        "reference_id" uuid NOT NULL,
        "dedupe_key" character varying(300) NOT NULL,
        "payload" jsonb NOT NULL DEFAULT '{}',
        "status" character varying(20) NOT NULL,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_space_id" ON "notifications" ("space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_space_user_status" ON "notifications" ("space_id", "user_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_space_dedupe_key" ON "notifications" ("space_id", "dedupe_key")
    `);
    // Partial unique index: at most one OPEN (unresolved) notification per
    // (dedupeKey, recipient) — the race guard on top of the application-level
    // idempotency check in UpsertConditionNotificationCommandHandler /
    // OpenNotificationService. See notifications-module design.md
    // "Duplicate-row race protection".
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_notifications_dedupe_key_user_open"
      ON "notifications" ("dedupe_key", "user_id")
      WHERE "resolved_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "FK_notifications_space_id"
    `);
    await queryRunner.query(
      `DROP INDEX "UQ_notifications_dedupe_key_user_open"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_notifications_space_dedupe_key"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_space_user_status"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_space_id"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}

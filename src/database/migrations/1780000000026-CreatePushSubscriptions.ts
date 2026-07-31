import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushSubscriptions1780000000026 implements MigrationInterface {
  name = 'CreatePushSubscriptions1780000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "push_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" character varying(255) NOT NULL,
        "auth" character varying(255) NOT NULL,
        "user_agent" character varying(512),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_push_subscriptions_endpoint" ON "push_subscriptions" ("endpoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_push_subscriptions_user_id" ON "push_subscriptions" ("user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_push_subscriptions_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_push_subscriptions_endpoint"`);
    await queryRunner.query(`DROP TABLE "push_subscriptions"`);
  }
}

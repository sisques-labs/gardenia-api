import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthSessions1779953632660 implements MigrationInterface {
  name = 'CreateAuthSessions1779953632660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "revokedAt" TIMESTAMP NULL,
        "deviceInfo" character varying(512) NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions" ("userId")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_auth_sessions_token_hash" ON "auth_sessions" ("tokenHash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_auth_sessions_token_hash"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_auth_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_sessions"`);
  }
}

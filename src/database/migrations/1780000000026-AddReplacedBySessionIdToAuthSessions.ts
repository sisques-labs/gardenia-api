import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplacedBySessionIdToAuthSessions1780000000026 implements MigrationInterface {
  name = 'AddReplacedBySessionIdToAuthSessions1780000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ADD COLUMN "replacedBySessionId" uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ADD CONSTRAINT "FK_auth_sessions_replaced_by_session_id"
      FOREIGN KEY ("replacedBySessionId") REFERENCES "auth_sessions" ("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      DROP CONSTRAINT "FK_auth_sessions_replaced_by_session_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      DROP COLUMN "replacedBySessionId"
    `);
  }
}

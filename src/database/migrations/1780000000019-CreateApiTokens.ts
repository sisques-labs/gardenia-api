import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiTokens1780000000019 implements MigrationInterface {
  name = 'CreateApiTokens1780000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_tokens" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "spaceId" uuid NOT NULL,
        "label" character varying(100) NOT NULL,
        "tokenHash" character varying(64) NOT NULL,
        "lastUsedAt" TIMESTAMP,
        "revokedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_tokens_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_api_tokens_user_id" ON "api_tokens" ("userId")
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_api_tokens_token_hash" ON "api_tokens" ("tokenHash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_api_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_api_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "api_tokens"`);
  }
}

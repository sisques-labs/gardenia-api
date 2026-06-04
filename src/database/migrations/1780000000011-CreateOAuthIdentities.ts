import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuthIdentities1780000000011 implements MigrationInterface {
  name = 'CreateOAuthIdentities1780000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "oauth_identities" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider" character varying(16) NOT NULL,
        "provider_user_id" character varying(255) NOT NULL,
        "email" character varying(320) NULL,
        "email_verified" boolean NOT NULL DEFAULT false,
        "access_token_enc" text NULL,
        "refresh_token_enc" text NULL,
        "token_expires_at" TIMESTAMP NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_oauth_identities_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_oauth_identities_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_oauth_identities_user_id"
        ON "oauth_identities" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_oauth_identities_provider_user"
        ON "oauth_identities" ("provider", "provider_user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_oauth_identities_provider_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_oauth_identities_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "oauth_identities" DROP CONSTRAINT IF EXISTS "FK_oauth_identities_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "oauth_identities"`);
  }
}

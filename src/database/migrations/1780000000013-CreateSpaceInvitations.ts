import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpaceInvitations1780000000013 implements MigrationInterface {
  name = 'CreateSpaceInvitations1780000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "space_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "space_id" uuid NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "code" character varying NOT NULL,
        "display_code" character varying NOT NULL,
        "qr_id" uuid,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL,
        "updated_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_space_invitations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_space_invitations_code" UNIQUE ("code"),
        CONSTRAINT "FK_space_invitations_space_id" FOREIGN KEY ("space_id")
          REFERENCES "spaces" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_space_invitations_space_id" ON "space_invitations" ("space_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_space_invitations_code" ON "space_invitations" ("code")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_space_invitations_expires_at" ON "space_invitations" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_space_invitations_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_space_invitations_code"`);
    await queryRunner.query(`DROP INDEX "IDX_space_invitations_space_id"`);
    await queryRunner.query(`DROP TABLE "space_invitations"`);
  }
}

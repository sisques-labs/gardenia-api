import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSpaceMemberships1780000000002 implements MigrationInterface {
  name = 'CreateSpaceMemberships1780000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "space_memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "space_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "joined_at" TIMESTAMP NOT NULL,
        CONSTRAINT "PK_space_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_space_memberships_space_user" UNIQUE ("space_id", "user_id"),
        CONSTRAINT "FK_space_memberships_space_id" FOREIGN KEY ("space_id")
          REFERENCES "spaces" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_space_memberships_user_id" ON "space_memberships" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_space_memberships_user_id"`);
    await queryRunner.query(`DROP TABLE "space_memberships"`);
  }
}

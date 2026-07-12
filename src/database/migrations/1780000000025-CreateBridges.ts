import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBridges1780000000025 implements MigrationInterface {
  name = 'CreateBridges1780000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bridges" (
        "id" uuid NOT NULL,
        "space_id" uuid,
        "name" character varying(100),
        "status" character varying(20) NOT NULL DEFAULT 'UNCLAIMED',
        "pairing_code" character varying(16),
        "last_seen_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bridges_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_bridges_space_id" ON "bridges" ("space_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_bridges_space_id"`);
    await queryRunner.query(`DROP TABLE "bridges"`);
  }
}

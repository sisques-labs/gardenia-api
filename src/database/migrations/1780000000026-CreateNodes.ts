import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNodes1780000000026 implements MigrationInterface {
  name = 'CreateNodes1780000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "nodes" (
        "id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "bridge_id" uuid NOT NULL,
        "name" character varying(100),
        "status" character varying(20) NOT NULL DEFAULT 'OFFLINE',
        "last_seen_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nodes_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_nodes_space_id" ON "nodes" ("space_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_nodes_bridge_id" ON "nodes" ("bridge_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_nodes_bridge_id"`);
    await queryRunner.query(`DROP INDEX "IDX_nodes_space_id"`);
    await queryRunner.query(`DROP TABLE "nodes"`);
  }
}

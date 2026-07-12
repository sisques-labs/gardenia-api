import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNodeCommandAcks1780000000028 implements MigrationInterface {
  name = 'CreateNodeCommandAcks1780000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "node_command_acks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "command_id" character varying(64),
        "node_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "result" character varying(50) NOT NULL,
        "received_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_node_command_acks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_node_command_acks_command_id" ON "node_command_acks" ("command_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_node_command_acks_command_id"`);
    await queryRunner.query(`DROP TABLE "node_command_acks"`);
  }
}

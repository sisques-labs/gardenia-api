import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNodeTelemetryReadings1780000000027 implements MigrationInterface {
  name = 'CreateNodeTelemetryReadings1780000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "node_telemetry_readings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "space_id" uuid NOT NULL,
        "node_id" uuid NOT NULL,
        "sensor_type" character varying(30) NOT NULL,
        "value" numeric NOT NULL,
        "unit" character varying(20),
        "recorded_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_node_telemetry_readings_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_node_telemetry_readings_space_node_recorded" ON "node_telemetry_readings" ("space_id", "node_id", "recorded_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_node_telemetry_readings_space_node_recorded"`,
    );
    await queryRunner.query(`DROP TABLE "node_telemetry_readings"`);
  }
}

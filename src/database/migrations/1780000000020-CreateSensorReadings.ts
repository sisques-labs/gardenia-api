import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSensorReadings1780000000020 implements MigrationInterface {
  name = 'CreateSensorReadings1780000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sensor_readings" (
        "id" uuid NOT NULL,
        "plant_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "metric" character varying(50) NOT NULL,
        "value" decimal(14,4) NOT NULL,
        "unit" character varying(50) NOT NULL DEFAULT '',
        "measured_at" TIMESTAMPTZ NOT NULL,
        "source" character varying(200) NOT NULL DEFAULT '',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sensor_readings_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_sensor_readings_latest"
      ON "sensor_readings" ("space_id", "plant_id", "metric", "measured_at")
    `);
    await queryRunner.query(`
      ALTER TABLE "sensor_readings"
      ADD CONSTRAINT "FK_sensor_readings_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sensor_readings" DROP CONSTRAINT IF EXISTS "FK_sensor_readings_space_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_sensor_readings_latest"`);
    await queryRunner.query(`DROP TABLE "sensor_readings"`);
  }
}

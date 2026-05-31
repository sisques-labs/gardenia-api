import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateQrs1780000000006 implements MigrationInterface {
  name = 'CreateQrs1780000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "qrs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "space_id" uuid NOT NULL,
        "target_url" character varying(2000) NOT NULL,
        "png_image" bytea NOT NULL,
        "generation" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_qrs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_qrs_space_id" ON "qrs" ("space_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "qrs"`);
  }
}

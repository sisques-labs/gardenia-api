import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiles1780000000019 implements MigrationInterface {
  name = 'CreateFiles1780000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "filename" character varying(255) NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" integer NOT NULL,
        "storage_key" character varying(512) NOT NULL,
        "url" character varying(1024) NOT NULL,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_files_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_files_space_id" ON "files" ("space_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "file_contents" (
        "file_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "data" bytea NOT NULL,
        CONSTRAINT "PK_file_contents_file_id" PRIMARY KEY ("file_id"),
        CONSTRAINT "FK_file_contents_file_id" FOREIGN KEY ("file_id")
          REFERENCES "files" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_file_contents_space_id" ON "file_contents" ("space_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_file_contents_space_id"`);
    await queryRunner.query(`DROP TABLE "file_contents"`);
    await queryRunner.query(`DROP INDEX "IDX_files_space_id"`);
    await queryRunner.query(`DROP TABLE "files"`);
  }
}

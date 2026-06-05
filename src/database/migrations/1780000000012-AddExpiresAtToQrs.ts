import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiresAtToQrs1780000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE qrs ADD COLUMN expires_at TIMESTAMPTZ NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE qrs DROP COLUMN expires_at`);
  }
}

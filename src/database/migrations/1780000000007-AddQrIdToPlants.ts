import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrIdToPlants1780000000007 implements MigrationInterface {
  name = 'AddQrIdToPlants1780000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD COLUMN "qr_id" uuid
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plants" DROP COLUMN "qr_id"`);
  }
}

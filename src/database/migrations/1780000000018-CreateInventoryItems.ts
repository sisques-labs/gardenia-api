import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryItems1780000000018 implements MigrationInterface {
  name = 'CreateInventoryItems1780000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "inventory_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "item_type" character varying(50) NOT NULL,
        "name" character varying(200) NOT NULL,
        "brand" character varying(200),
        "notes" text,
        "quantity" decimal(12,3) NOT NULL,
        "unit" character varying(50) NOT NULL,
        "low_stock_threshold" decimal(12,3),
        "acquired_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_items_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_items_space_id" ON "inventory_items" ("space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_inventory_items_expires_at" ON "inventory_items" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_inventory_items_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_inventory_items_space_id"`);
    await queryRunner.query(`DROP TABLE "inventory_items"`);
  }
}

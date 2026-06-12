import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantRelationshipIndexesAndFks1780000000015 implements MigrationInterface {
  name = 'AddTenantRelationshipIndexesAndFks1780000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_plants_space_id" ON "plants" ("space_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_plants_user_id" ON "plants" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_plants_plant_species_id" ON "plants" ("plant_species_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_plants_planting_spot_id" ON "plants" ("planting_spot_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_planting_spots_user_id" ON "planting_spots" ("user_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "FK_accounts_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD CONSTRAINT "FK_accounts_user_id"
      FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
      ADD CONSTRAINT "FK_planting_spots_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "planting_spots"
      ADD CONSTRAINT "FK_planting_spots_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_plant_species_id"
      FOREIGN KEY ("plant_species_id") REFERENCES "plant_species" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "plants"
      ADD CONSTRAINT "FK_plants_planting_spot_id"
      FOREIGN KEY ("planting_spot_id") REFERENCES "planting_spots" ("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "qrs"
      ADD CONSTRAINT "FK_qrs_space_id"
      FOREIGN KEY ("space_id") REFERENCES "spaces" ("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "qrs" DROP CONSTRAINT IF EXISTS "FK_qrs_space_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_planting_spot_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_plant_species_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "plants" DROP CONSTRAINT IF EXISTS "FK_plants_space_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "planting_spots" DROP CONSTRAINT IF EXISTS "FK_planting_spots_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "planting_spots" DROP CONSTRAINT IF EXISTS "FK_planting_spots_space_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "FK_accounts_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP CONSTRAINT IF EXISTS "FK_accounts_space_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_space_id"
    `);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_planting_spots_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_plants_planting_spot_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_plants_plant_species_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_plants_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_plants_space_id"`);
  }
}

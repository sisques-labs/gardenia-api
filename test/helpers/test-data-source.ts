import { DataSource, DataSourceOptions } from 'typeorm';

import { AccountEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/account.entity';
import { AuthSessionEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/entities/auth-session.entity';
import { SpaceEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space.entity';
import { SpaceInvitationEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space-invitation.entity';
import { SpaceMembershipEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space-membership.entity';
import { UserTypeOrmEntity } from '../../src/contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { PlantSpeciesTypeOrmEntity } from '../../src/contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantTypeOrmEntity } from '../../src/contexts/plants/infrastructure/persistence/typeorm/entities/plant.entity';
import { QrTypeOrmEntity } from '../../src/contexts/qr/infrastructure/persistence/typeorm/entities/qr.entity';
import { InitialSchema1779729423499 } from '../../src/database/migrations/1779729423499-InitialSchema';
import { CreateAuthSessions1779953632660 } from '../../src/database/migrations/1779953632660-CreateAuthSessions';
import { CreateSpaces1780000000001 } from '../../src/database/migrations/1780000000001-CreateSpaces';
import { CreateSpaceMemberships1780000000002 } from '../../src/database/migrations/1780000000002-CreateSpaceMemberships';
import { AddSpaceIdToAccounts1780000000003 } from '../../src/database/migrations/1780000000003-AddSpaceIdToAccounts';
import { AddSpaceIdToUsers1780000000004 } from '../../src/database/migrations/1780000000004-AddSpaceIdToUsers';
import { CreatePlants1780000000005 } from '../../src/database/migrations/1780000000005-CreatePlants';
import { CreateQrs1780000000006 } from '../../src/database/migrations/1780000000006-CreateQrs';
import { LinkPlantsToQrs1780000000007 } from '../../src/database/migrations/1780000000007-LinkPlantsToQrs';
import { CreatePlantSpecies1780000000008 } from '../../src/database/migrations/1780000000008-CreatePlantSpecies';
import { AlterPlantsPlantSpeciesId1780000000009 } from '../../src/database/migrations/1780000000009-AlterPlantsPlantSpeciesId';
import { CreatePlantingSpots1780000000010 } from '../../src/database/migrations/1780000000010-CreatePlantingSpots';
import { AddPlantingSpotIdToPlants1780000000011 } from '../../src/database/migrations/1780000000011-AddPlantingSpotIdToPlants';
import { AddExpiresAtToQrs1780000000012 } from '../../src/database/migrations/1780000000012-AddExpiresAtToQrs';
import { CreateSpaceInvitations1780000000013 } from '../../src/database/migrations/1780000000013-CreateSpaceInvitations';

const TEST_ENTITIES = [
  AccountEntity,
  AuthSessionEntity,
  UserTypeOrmEntity,
  SpaceEntity,
  SpaceMembershipEntity,
  SpaceInvitationEntity,
  PlantSpeciesTypeOrmEntity,
  PlantTypeOrmEntity,
  QrTypeOrmEntity,
];

const TEST_MIGRATIONS = [
  InitialSchema1779729423499,
  CreateAuthSessions1779953632660,
  CreateSpaces1780000000001,
  CreateSpaceMemberships1780000000002,
  AddSpaceIdToAccounts1780000000003,
  AddSpaceIdToUsers1780000000004,
  CreatePlants1780000000005,
  CreateQrs1780000000006,
  LinkPlantsToQrs1780000000007,
  CreatePlantSpecies1780000000008,
  AlterPlantsPlantSpeciesId1780000000009,
  CreatePlantingSpots1780000000010,
  AddPlantingSpotIdToPlants1780000000011,
  AddExpiresAtToQrs1780000000012,
  CreateSpaceInvitations1780000000013,
];

export function getTestDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5433', 10),
    database: process.env.DATABASE_DATABASE ?? 'gardenia_test',
    username: process.env.DATABASE_USERNAME ?? 'gardenia',
    password: process.env.DATABASE_PASSWORD ?? 'gardenia',
    entities: TEST_ENTITIES,
    migrations: TEST_MIGRATIONS,
    migrationsTableName:
      process.env.DATABASE_MIGRATIONS_TABLE_NAME ?? 'migrations',
    synchronize: false,
    logging: false,
  };
}

let migrationsApplied = false;

/**
 * Applies pending TypeORM migrations against the test database.
 * Safe to call multiple times — runs once per Jest process.
 */
export async function bootstrapTestDataSource(): Promise<void> {
  if (migrationsApplied) {
    return;
  }

  const dataSource = new DataSource(getTestDataSourceOptions());

  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
    migrationsApplied = true;
  } catch (error) {
    const hint =
      'If the test DB was previously created with synchronize:true, reset it with: pnpm test:db:down && docker volume rm gardenia-api_postgres-test-data 2>/dev/null; pnpm test:db:up';

    throw new Error(
      `Failed to apply test database migrations. ${hint}\n\nOriginal error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

/** Reset migration guard — for test suites that need a fresh bootstrap. */
export function resetTestMigrationState(): void {
  migrationsApplied = false;
}

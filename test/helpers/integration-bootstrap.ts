import { DynamicModule, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SharedGraphQLModule } from '@sisques-labs/nestjs-kit';

import { AccountEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/account.entity';
import { ApiTokenEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/entities/api-token.entity';
import { AuthSessionEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/entities/auth-session.entity';
import { OAuthIdentityTypeOrmEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/entities/oauth-identity.entity';
import { HarvestTypeOrmEntity } from '../../src/contexts/harvests/infrastructure/persistence/typeorm/entities/harvest.entity';
import { InventoryItemTypeOrmEntity } from '../../src/contexts/inventory/infrastructure/persistence/typeorm/entities/inventory-item.entity';
import { SpaceEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space.entity';
import { SpaceInvitationEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space-invitation.entity';
import { SpaceMembershipEntity } from '../../src/contexts/spaces/infrastructure/persistence/typeorm/entities/space-membership.entity';
import { UserTypeOrmEntity } from '../../src/contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { PlantSpeciesTypeOrmEntity } from '../../src/contexts/plant-species/infrastructure/persistence/typeorm/entities/plant-species.entity';
import { PlantTypeOrmEntity } from '../../src/contexts/plants/infrastructure/persistence/typeorm/entities/plant.entity';
import { QrTypeOrmEntity } from '../../src/contexts/qr/infrastructure/persistence/typeorm/entities/qr.entity';
import { SensorReadingTypeOrmEntity } from '../../src/contexts/sensor-readings/infrastructure/persistence/typeorm/entities/sensor-reading.entity';
import { PlantingSpotTypeOrmEntity } from '../../src/contexts/planting-spots/infrastructure/persistence/typeorm/entities/planting-spot.entity';
import { CareLogEntryTypeOrmEntity } from '../../src/contexts/care-log/infrastructure/persistence/typeorm/entities/care-log-entry.entity';
import { appConfig } from '../../src/core/config/app.config';
import { authConfig } from '../../src/core/config/auth.config';
import { SharedModule } from '../../src/shared/shared.module';
import { SpaceContext } from '../../src/shared/space-context/space-context.service';
import { bootstrapTestDataSource } from './test-data-source';

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = parseInt(process.env.DATABASE_PORT ?? '5433', 10);
const DB_DATABASE = process.env.DATABASE_DATABASE ?? 'gardenia_test';
const DB_USERNAME = process.env.DATABASE_USERNAME ?? 'gardenia';
const DB_PASSWORD = process.env.DATABASE_PASSWORD ?? 'gardenia';

const TEST_ENTITIES = [
  AccountEntity,
  ApiTokenEntity,
  AuthSessionEntity,
  UserTypeOrmEntity,
  SpaceEntity,
  SpaceMembershipEntity,
  SpaceInvitationEntity,
  PlantSpeciesTypeOrmEntity,
  PlantTypeOrmEntity,
  QrTypeOrmEntity,
  PlantingSpotTypeOrmEntity,
  OAuthIdentityTypeOrmEntity,
  HarvestTypeOrmEntity,
  CareLogEntryTypeOrmEntity,
  InventoryItemTypeOrmEntity,
  SensorReadingTypeOrmEntity,
];

export interface IntegrationModuleOptions {
  imports: Array<Type<unknown> | DynamicModule>;
  providers?: Provider[];
}

export interface IntegrationContext {
  module: TestingModule;
  dataSource: DataSource;
  spaceContext: SpaceContext;
  close: () => Promise<void>;
}

export async function createIntegrationModule(
  options: IntegrationModuleOptions,
): Promise<IntegrationContext> {
  await bootstrapTestDataSource();

  const moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [authConfig, appConfig],
      }),
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        database: DB_DATABASE,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        entities: TEST_ENTITIES,
        synchronize: false,
        logging: false,
      }),
      CqrsModule,
      SharedModule,
      SharedGraphQLModule,
      ...options.imports,
    ],
    providers: options.providers ?? [],
  }).compile();

  const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
  const spaceContext = moduleFixture.get(SpaceContext);

  return {
    module: moduleFixture,
    dataSource,
    spaceContext,
    close: async () => {
      await moduleFixture.close();
    },
  };
}

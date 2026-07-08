import { DynamicModule, Provider, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { SharedGraphQLModule } from '@sisques-labs/nestjs-kit/graphql';

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
        // Entities are auto-loaded from whatever bounded-context module the test
        // imports (each registers its entity via TypeOrmModule.forFeature), so
        // adding a new context never requires editing this list. Mirrors the
        // production AppModule (autoLoadEntities: true).
        autoLoadEntities: true,
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

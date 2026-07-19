import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { BaseExceptionFilter } from '../../src/core/filters/base-exception.filter';
import { bootstrapTestDataSource } from './test-data-source';

export interface E2EContext {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  dataSource: DataSource;
  close: () => Promise<void>;
}

/**
 * DI provider override for `createE2EApp()`. Used to swap a real external
 * adapter (e.g. `PLANTNET_IDENTIFICATION_PORT`) for a test double when the
 * real provider would otherwise make a live third-party call the e2e suite
 * cannot/should not depend on.
 */
export interface E2EProviderOverride {
  provide: unknown;
  useValue?: unknown;
  useClass?: new (...args: never[]) => unknown;
}

export async function createE2EApp(
  overrides: E2EProviderOverride[] = [],
): Promise<E2EContext> {
  await bootstrapTestDataSource();

  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  for (const override of overrides) {
    const overrideBuilder = builder.overrideProvider(override.provide);
    if (override.useClass) {
      overrideBuilder.useClass(override.useClass);
    } else {
      overrideBuilder.useValue(override.useValue);
    }
  }

  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new BaseExceptionFilter());

  await app.init();

  const dataSource = moduleFixture.get<DataSource>(getDataSourceToken());

  return {
    app,
    http: () => request(app.getHttpServer()),
    dataSource,
    close: async () => {
      await app.close();
    },
  };
}

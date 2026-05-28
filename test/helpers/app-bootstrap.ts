import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';
import { AccountEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/account.entity';
import { AuthSessionEntity } from '../../src/contexts/auth/infrastructure/persistence/typeorm/entities/auth-session.entity';
import { UserTypeOrmEntity } from '../../src/contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { BaseExceptionFilter } from '../../src/core/filters/base-exception.filter';

export interface E2EContext {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  dataSource: DataSource;
  close: () => Promise<void>;
}

const DB_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DB_PORT = parseInt(process.env.DATABASE_PORT ?? '5433', 10);
const DB_DATABASE = process.env.DATABASE_DATABASE ?? 'gardenia_test';
const DB_USERNAME = process.env.DATABASE_USERNAME ?? 'gardenia';
const DB_PASSWORD = process.env.DATABASE_PASSWORD ?? 'gardenia';

export async function createE2EApp(): Promise<E2EContext> {
  const moduleFixture = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'postgres',
        host: DB_HOST,
        port: DB_PORT,
        database: DB_DATABASE,
        username: DB_USERNAME,
        password: DB_PASSWORD,
        entities: [AccountEntity, AuthSessionEntity, UserTypeOrmEntity],
        synchronize: true,
        logging: false,
      }),
      AppModule,
    ],
  }).compile();

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

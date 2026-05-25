import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const postgresConfig = registerAs(
  'postgres',
  (): TypeOrmModuleOptions => ({
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    synchronize: false,
    autoLoadEntities: true,
    migrationsRun: false,
  }),
);

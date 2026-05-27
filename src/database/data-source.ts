import 'dotenv/config';
import { DataSource } from 'typeorm';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable "${name}" for TypeORM CLI data source`);
  }
  return value;
}

export default new DataSource({
  type: requiredEnv('DATABASE_DRIVER') as 'postgres',
  host: requiredEnv('DATABASE_HOST'),
  port: Number(requiredEnv('DATABASE_PORT')),
  username: requiredEnv('DATABASE_USERNAME'),
  password: requiredEnv('DATABASE_PASSWORD'),
  database: requiredEnv('DATABASE_DATABASE'),
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: process.env.DATABASE_MIGRATIONS_TABLE_NAME ?? 'migrations',
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});

import 'dotenv/config';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '@sisques-labs/nestjs-kit/dist/shared/infrastructure/database/typeorm/data-source';

export default new DataSource({
  ...dataSourceOptions,
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});

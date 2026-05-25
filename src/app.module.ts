import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';

import '@core/transport/graphql/registered-enums.graphql';

import { authConfig } from '@core/config/auth.config';
import { postgresConfig } from '@core/config/postgres.config';

import { AuthModule } from '@contexts/auth/auth.module';
import { UsersModule } from '@contexts/users/users.module';

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [postgresConfig, authConfig],
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => cfg.get('postgres')!,
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req }: { req: Request }) => ({ req }),
    }),

    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}

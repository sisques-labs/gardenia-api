import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import '@core/transport/graphql/registered-enums.graphql';

import { postgresConfig } from '@core/config/postgres.config';
import { mongoConfig } from '@core/config/mongo.config';
import { authConfig } from '@core/config/auth.config';

import { AuthModule } from '@contexts/auth/auth.module';
import { UsersModule } from '@contexts/users/users.module';

@Module({
  imports: [
    CqrsModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
      load: [postgresConfig, mongoConfig, authConfig],
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => cfg.get('postgres')!,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('mongo.uri'),
      }),
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

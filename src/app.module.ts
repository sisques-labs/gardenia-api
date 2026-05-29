import { AuthModule } from '@contexts/auth/auth.module';
import { UsersModule } from '@contexts/users/users.module';
import { authConfig } from '@core/config/auth.config';
import { postgresConfig } from '@core/config/postgres.config';
import '@core/transport/graphql/registered-enums.graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SharedGraphQLModule } from '@sisques-labs/nestjs-kit';
@Module({
  imports: [
    CqrsModule.forRoot(),
    SharedGraphQLModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [postgresConfig, authConfig],
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<TypeOrmModuleOptions>('postgres'),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}

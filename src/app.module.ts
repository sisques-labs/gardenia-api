import { SupportModule } from './support/support.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from '@contexts/auth/auth.module';
import { UsersModule } from '@contexts/users/users.module';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { SpaceGuard } from '@contexts/spaces/transport/guards/space.guard';
import { SpaceInterceptor } from '@contexts/spaces/transport/interceptors/space.interceptor';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
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
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
@Module({
  imports: [
    SharedModule,
    SupportModule,
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
    SpacesModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // JwtAuthGuard runs first — authenticates the request and sets req.user
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // SpaceGuard runs after JWT — validates X-Space-ID and membership
    { provide: APP_GUARD, useClass: SpaceGuard },
    // SpaceInterceptor wraps the handler in an ALS frame keyed by spaceId
    { provide: APP_INTERCEPTOR, useClass: SpaceInterceptor },
  ],
})
export class AppModule {}

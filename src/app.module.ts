import { HealthModule } from '@core/health/health.module';
import { SupportModule } from './support/support.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from '@contexts/auth/auth.module';
import { UsersModule } from '@contexts/users/users.module';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { PlantsModule } from '@contexts/plants/plants.module';
import { PlantingSpotsModule } from '@contexts/planting-spots/planting-spots.module';
import { QrModule } from '@contexts/qr/qr.module';
import { CareLogModule } from '@contexts/care-log/care-log.module';
import { PlantSpeciesModule } from '@contexts/plant-species/plant-species.module';
import { appConfig } from '@core/config/app.config';
import { SpaceGuard } from '@contexts/spaces/transport/guards/space.guard';
import { SpaceInterceptor } from '@contexts/spaces/transport/interceptors/space.interceptor';
import { OptionalJwtAuthGuard } from '@contexts/auth/infrastructure/guards/optional-jwt-auth.guard';
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
      load: [postgresConfig, authConfig, appConfig],
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
      // Field resolvers run after the parent handler completes, so the ALS
      // frame from SpaceInterceptor is gone. Re-apply guards/interceptors so
      // req.spaceId (set by SpaceGuard) is wrapped again for tenant repos.
      fieldResolverEnhancers: ['guards', 'interceptors'],
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
    }),
    HealthModule,
    SpacesModule,
    AuthModule,
    UsersModule,
    QrModule,
    PlantSpeciesModule,
    PlantsModule,
    PlantingSpotsModule,
    CareLogModule,
  ],
  providers: [
    // OptionalJwtAuthGuard runs first — decodes JWT if present, passes through
    // if no token (public routes), throws only on invalid/expired tokens.
    { provide: APP_GUARD, useClass: OptionalJwtAuthGuard },
    // SpaceGuard runs after JWT — validates X-Space-ID and membership
    { provide: APP_GUARD, useClass: SpaceGuard },
    // SpaceInterceptor wraps the handler in an ALS frame keyed by spaceId
    { provide: APP_INTERCEPTOR, useClass: SpaceInterceptor },
  ],
})
export class AppModule {}

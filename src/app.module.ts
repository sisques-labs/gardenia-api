import { AuthModule } from '@contexts/auth/auth.module';
import { OptionalJwtAuthGuard } from '@contexts/auth/infrastructure/guards/optional-jwt-auth.guard';
import { CareLogModule } from '@contexts/care-log/care-log.module';
import { CareScheduleModule } from '@contexts/care-schedule/care-schedule.module';
import { FilesModule } from '@contexts/files/files.module';
import { HarvestsModule } from '@contexts/harvests/harvests.module';
import { InventoryModule } from '@contexts/inventory/inventory.module';
import { PlantPhotosModule } from '@contexts/plant-photos/plant-photos.module';
import { PlantSpeciesModule } from '@contexts/plant-species/plant-species.module';
import { PlantingSpotsModule } from '@contexts/planting-spots/planting-spots.module';
import { PlantsModule } from '@contexts/plants/plants.module';
import { QrModule } from '@contexts/qr/qr.module';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { SpaceGuard } from '@contexts/spaces/transport/guards/space.guard';
import { SpaceInterceptor } from '@contexts/spaces/transport/interceptors/space.interceptor';
import { UsersModule } from '@contexts/users/users.module';
import { WeatherModule } from '@contexts/weather/weather.module';
import { appConfig } from '@core/config/app.config';
import { authConfig } from '@core/config/auth.config';
import { validateEnv } from '@core/config/env.validation';
import { kafkaConfig } from '@core/config/kafka.config';
import { postgresConfig } from '@core/config/postgres.config';
import { sentryConfig } from '@core/config/sentry.config';
import { HealthModule } from '@core/health/health.module';
import { McpModule } from '@core/mcp/mcp.module';
import { MessagingModule } from '@core/messaging/messaging.module';
import { MetricsModule } from '@core/metrics/metrics.module';
import { ObservabilityModule } from '@core/observability/observability.module';
import '@core/transport/graphql/registered-enums.graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SharedGraphQLModule } from '@sisques-labs/nestjs-kit';
import { SharedModule } from './shared/shared.module';
import { SupportModule } from './support/support.module';
@Module({
  imports: [
    SharedModule,
    SupportModule,
    CqrsModule.forRoot(),
    SharedGraphQLModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [postgresConfig, authConfig, appConfig, sentryConfig, kafkaConfig],
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
    ObservabilityModule,
    MetricsModule,
    MessagingModule,
    HealthModule,
    McpModule,
    WeatherModule,
    SpacesModule,
    AuthModule,
    UsersModule,
    QrModule,
    PlantSpeciesModule,
    PlantsModule,
    PlantingSpotsModule,
    CareLogModule,
    HarvestsModule,
    InventoryModule,
    CareScheduleModule,
    FilesModule,
    PlantPhotosModule,
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

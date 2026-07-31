import { AuthModule } from '@contexts/auth/auth.module';
import { CareLogModule } from '@contexts/care-log/care-log.module';
import { CareScheduleModule } from '@contexts/care-schedule/care-schedule.module';
import { FilesModule } from '@contexts/files/files.module';
import { HarvestsModule } from '@contexts/harvests/harvests.module';
import { InventoryModule } from '@contexts/inventory/inventory.module';
import { NotificationsModule } from '@contexts/notifications/notifications.module';
import { PlantIdentificationModule } from '@contexts/plant-identification/plant-identification.module';
import { PlantPhotosModule } from '@contexts/plant-photos/plant-photos.module';
import { PlantSpeciesModule } from '@contexts/plant-species/plant-species.module';
import { PlantingSpotsModule } from '@contexts/planting-spots/planting-spots.module';
import { PlantsModule } from '@contexts/plants/plants.module';
import { QrModule } from '@contexts/qr/qr.module';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { UsersModule } from '@contexts/users/users.module';
import { WeatherModule } from '@contexts/weather/weather.module';
import { Module } from '@nestjs/common';

// Register every bounded context module here as it's added.
const CONTEXT_MODULES = [
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
  PlantIdentificationModule,
  NotificationsModule,
];

@Module({
  imports: [...CONTEXT_MODULES],
})
export class ContextsModule {}

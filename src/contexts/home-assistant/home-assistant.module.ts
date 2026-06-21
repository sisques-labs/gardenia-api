import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { HA_WRITE_PORT } from '@contexts/home-assistant/application/ports/ha-write.port';
import { INVENTORY_STATE_PORT } from '@contexts/home-assistant/application/ports/inventory-state.port';
import { PLANT_STATE_PORT } from '@contexts/home-assistant/application/ports/plant-state.port';
import { SPACE_SUMMARY_PORT } from '@contexts/home-assistant/application/ports/space-summary.port';
import { WEATHER_STATE_PORT } from '@contexts/home-assistant/application/ports/weather-state.port';
import { HaWriteAdapter } from '@contexts/home-assistant/infrastructure/adapters/ha-write.adapter';
import { InventoryStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/inventory-state.adapter';
import { PlantStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/plant-state.adapter';
import { SpaceSummaryAdapter } from '@contexts/home-assistant/infrastructure/adapters/space-summary.adapter';
import { WeatherStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/weather-state.adapter';
import { HaReconcileService } from '@contexts/home-assistant/infrastructure/services/ha-reconcile.service';
import { HaCommandRouter } from '@contexts/home-assistant/transport/mqtt/ha-command.router';

/**
 * The Home Assistant bridge: publishes MQTT Discovery + retained state for
 * bridged spaces (HA reads) and routes HA command topics back into Gardenia
 * commands (HA writes). Reaches other contexts only through ports implemented
 * by adapters that dispatch via the Query/Command bus (boundary-safe).
 *
 * Inert unless `MQTT_ENABLED=true` and `HA_BRIDGED_SPACES` is set.
 */
const INFRASTRUCTURE_ADAPTERS = [
  { provide: PLANT_STATE_PORT, useClass: PlantStateAdapter },
  { provide: SPACE_SUMMARY_PORT, useClass: SpaceSummaryAdapter },
  { provide: WEATHER_STATE_PORT, useClass: WeatherStateAdapter },
  { provide: INVENTORY_STATE_PORT, useClass: InventoryStateAdapter },
  { provide: HA_WRITE_PORT, useClass: HaWriteAdapter },
];

const INFRASTRUCTURE_SERVICES = [HaReconcileService];

const TRANSPORT_PROVIDERS = [HaCommandRouter];

@Module({
  imports: [CqrsModule],
  providers: [
    ...INFRASTRUCTURE_ADAPTERS,
    ...INFRASTRUCTURE_SERVICES,
    ...TRANSPORT_PROVIDERS,
  ],
})
export class HomeAssistantModule {}

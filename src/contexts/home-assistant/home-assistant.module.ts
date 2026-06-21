import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { PLANT_STATE_PORT } from '@contexts/home-assistant/application/ports/plant-state.port';
import { PlantStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/plant-state.adapter';
import { HaReconcileService } from '@contexts/home-assistant/infrastructure/services/ha-reconcile.service';

/**
 * The Home Assistant bridge: publishes MQTT Discovery + retained state for
 * bridged spaces. Reaches the plants/care-log contexts only through ports
 * implemented by adapters that dispatch via the Query bus (boundary-safe).
 *
 * Inert unless `MQTT_ENABLED=true` and `HA_BRIDGED_SPACES` is set — the shared
 * `MqttService` is a no-op when disabled, so the reconcile loop publishes
 * nothing.
 */
const INFRASTRUCTURE_ADAPTERS = [
  { provide: PLANT_STATE_PORT, useClass: PlantStateAdapter },
];

const INFRASTRUCTURE_SERVICES = [HaReconcileService];

@Module({
  imports: [CqrsModule],
  providers: [...INFRASTRUCTURE_ADAPTERS, ...INFRASTRUCTURE_SERVICES],
})
export class HomeAssistantModule {}

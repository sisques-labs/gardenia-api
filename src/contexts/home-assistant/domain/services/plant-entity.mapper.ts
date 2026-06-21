import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { PlantHaState } from '@contexts/home-assistant/domain/interfaces/plant-ha-state.interface';
import { HaSensorBuilder } from '@contexts/home-assistant/domain/services/ha-sensor.builder';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

const UNKNOWN_STATE = 'None';

/**
 * Maps a plant's state to Home Assistant MQTT Discovery messages. Each plant
 * becomes an HA *device* (grouped under the space hub via `via_device`) with a
 * `last_watered` timestamp sensor. Adding more per-plant sensors (health,
 * next-care) follows this exact shape.
 *
 * Pure — no I/O. The reconcile service publishes the returned messages.
 */
export class PlantEntityMapper {
  private readonly sensors = new HaSensorBuilder();

  toMessages(
    topics: HaTopicFactory,
    spaceId: string,
    plant: PlantHaState,
  ): HaDiscoveryMessage[] {
    const node = topics.node(spaceId);
    const device = {
      identifiers: [`${node}_plant_${plant.plantId}`],
      name: plant.name,
      manufacturer: 'Gardenia',
      model: 'Plant',
      via_device: node,
    };

    return [
      this.sensors.build(topics, spaceId, {
        objectId: `plant_${plant.plantId}_last_watered`,
        name: 'Last watered',
        deviceClass: 'timestamp',
        stateSegments: ['plant', plant.plantId, 'last_watered'],
        state: plant.lastWateredAt
          ? plant.lastWateredAt.toISOString()
          : UNKNOWN_STATE,
        device,
      }),
    ];
  }
}

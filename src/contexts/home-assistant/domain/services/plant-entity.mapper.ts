import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { PlantHaState } from '@contexts/home-assistant/domain/interfaces/plant-ha-state.interface';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

const UNKNOWN_STATE = 'None';

/**
 * Maps a plant's state to Home Assistant MQTT Discovery messages. Each plant
 * becomes an HA *device* (grouped by `via_device` under the space hub) with a
 * `last_watered` timestamp sensor. Adding more sensors/contexts (health,
 * harvests, inventory) follows this exact shape.
 *
 * Pure — no I/O. The reconcile service publishes the returned messages.
 */
export class PlantEntityMapper {
  toMessages(
    topics: HaTopicFactory,
    spaceId: string,
    plant: PlantHaState,
  ): HaDiscoveryMessage[] {
    const node = topics.node(spaceId);
    const objectId = `plant_${plant.plantId}_last_watered`;
    const uniqueId = `${node}_${objectId}`;
    const stateTopic = topics.state(
      spaceId,
      'plant',
      plant.plantId,
      'last_watered',
    );

    return [
      {
        configTopic: topics.discoveryConfig('sensor', node, objectId),
        config: {
          name: 'Last watered',
          unique_id: uniqueId,
          object_id: uniqueId,
          device_class: 'timestamp',
          state_topic: stateTopic,
          availability_topic: topics.availability(spaceId),
          device: {
            identifiers: [`${node}_plant_${plant.plantId}`],
            name: plant.name,
            manufacturer: 'Gardenia',
            model: 'Plant',
            via_device: node,
          },
        },
        stateTopic,
        state: plant.lastWateredAt
          ? plant.lastWateredAt.toISOString()
          : UNKNOWN_STATE,
      },
    ];
  }
}

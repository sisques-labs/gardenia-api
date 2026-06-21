import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { SpaceHaSummary } from '@contexts/home-assistant/domain/interfaces/space-ha-summary.interface';
import {
  HaSensorBuilder,
  HaSensorDevice,
} from '@contexts/home-assistant/domain/services/ha-sensor.builder';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

const UNKNOWN_STATE = 'None';

/**
 * Maps per-space aggregate counts onto the space *hub* device's sensors
 * (plant/harvest/inventory totals + low-stock + last harvest time).
 */
export class SpaceSummaryMapper {
  private readonly sensors = new HaSensorBuilder();

  toMessages(
    topics: HaTopicFactory,
    spaceId: string,
    summary: SpaceHaSummary,
  ): HaDiscoveryMessage[] {
    const device = hubDevice(topics, spaceId);

    return [
      this.sensors.build(topics, spaceId, {
        objectId: 'plants_total',
        name: 'Plants',
        stateSegments: ['summary', 'plants_total'],
        state: String(summary.plantCount),
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'harvests_total',
        name: 'Harvests',
        stateSegments: ['summary', 'harvests_total'],
        state: String(summary.harvestCount),
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'last_harvest',
        name: 'Last harvest',
        deviceClass: 'timestamp',
        stateSegments: ['summary', 'last_harvest'],
        state: summary.lastHarvestAt
          ? summary.lastHarvestAt.toISOString()
          : UNKNOWN_STATE,
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'inventory_items_total',
        name: 'Inventory items',
        stateSegments: ['summary', 'inventory_items_total'],
        state: String(summary.inventoryItemCount),
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'inventory_low_stock',
        name: 'Low stock items',
        stateSegments: ['summary', 'inventory_low_stock'],
        state: String(summary.lowStockCount),
        device,
      }),
    ];
  }
}

/** The space-level hub device that groups all aggregate + weather sensors. */
export function hubDevice(
  topics: HaTopicFactory,
  spaceId: string,
): HaSensorDevice {
  return {
    identifiers: [topics.node(spaceId)],
    name: 'Gardenia',
    manufacturer: 'Gardenia',
    model: 'Space',
  };
}

import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { InventoryHaState } from '@contexts/home-assistant/domain/interfaces/inventory-ha-state.interface';
import { HaSensorBuilder } from '@contexts/home-assistant/domain/services/ha-sensor.builder';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

const ADJUST_LIMIT = 1000;

/**
 * Maps an inventory item to its own HA device: a `quantity` sensor (read) and
 * an `adjust` number (write). Publishing a value N to the number's command
 * topic adjusts the item's quantity by N (a delta).
 */
export class InventoryEntityMapper {
  private readonly sensors = new HaSensorBuilder();

  toMessages(
    topics: HaTopicFactory,
    spaceId: string,
    item: InventoryHaState,
  ): HaDiscoveryMessage[] {
    const node = topics.node(spaceId);
    const device = {
      identifiers: [`${node}_inventory_${item.itemId}`],
      name: item.name,
      manufacturer: 'Gardenia',
      model: 'Inventory item',
      via_device: node,
    };

    return [
      this.sensors.build(topics, spaceId, {
        objectId: `inventory_${item.itemId}_quantity`,
        name: 'Quantity',
        unit: item.unit,
        stateSegments: ['inventory', item.itemId, 'quantity'],
        state: String(item.quantity),
        device,
      }),
      // HA → Gardenia: published value is the delta to apply.
      this.sensors.number(topics, spaceId, {
        objectId: `inventory_${item.itemId}_adjust`,
        name: 'Adjust quantity',
        commandSegments: ['inventory', item.itemId, 'adjust'],
        stateSegments: ['inventory', item.itemId, 'adjust'],
        state: '0',
        min: -ADJUST_LIMIT,
        max: ADJUST_LIMIT,
        step: 1,
        unit: item.unit,
        device,
      }),
    ];
  }
}

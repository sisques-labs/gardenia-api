import { HaTopicFactory } from './ha-topic.factory';
import { InventoryEntityMapper } from './inventory-entity.mapper';

describe('InventoryEntityMapper', () => {
  const topics = new HaTopicFactory('gardenia', 'homeassistant');
  const mapper = new InventoryEntityMapper();

  it('maps an item to a quantity sensor and an adjust number', () => {
    const messages = mapper.toMessages(topics, 's1', {
      itemId: 'i1',
      name: 'Compost',
      quantity: 12,
      unit: 'kg',
    });

    const quantity = messages.find((m) => m.configTopic.includes('/sensor/'))!;
    expect(quantity.stateTopic).toBe('gardenia/s1/inventory/i1/quantity/state');
    expect(quantity.state).toBe('12');
    expect(quantity.config.unit_of_measurement).toBe('kg');

    const adjust = messages.find((m) => m.configTopic.includes('/number/'))!;
    expect(adjust.config.command_topic).toBe(
      'gardenia/s1/inventory/i1/adjust/set',
    );
    expect(adjust.config).toMatchObject({ min: -1000, max: 1000, step: 1 });
  });
});

import { HaTopicFactory } from './ha-topic.factory';
import { SpaceSummaryMapper } from './space-summary.mapper';

describe('SpaceSummaryMapper', () => {
  const topics = new HaTopicFactory('gardenia', 'homeassistant');
  const mapper = new SpaceSummaryMapper();

  it('maps counts onto hub sensors grouped under the space device', () => {
    const messages = mapper.toMessages(topics, 's1', {
      plantCount: 3,
      harvestCount: 2,
      lastHarvestAt: new Date('2026-06-01T10:00:00.000Z'),
      inventoryItemCount: 5,
      lowStockCount: 1,
    });

    const byObject = Object.fromEntries(messages.map((m) => [m.stateTopic, m]));
    expect(byObject['gardenia/s1/summary/plants_total/state'].state).toBe('3');
    expect(byObject['gardenia/s1/summary/harvests_total/state'].state).toBe(
      '2',
    );
    expect(byObject['gardenia/s1/summary/last_harvest/state'].state).toBe(
      '2026-06-01T10:00:00.000Z',
    );
    expect(
      byObject['gardenia/s1/summary/inventory_low_stock/state'].state,
    ).toBe('1');

    // All summary sensors share the one hub device.
    for (const message of messages) {
      expect(message.config.device).toMatchObject({
        identifiers: ['gardenia_s1'],
        model: 'Space',
      });
    }
  });

  it('emits "None" for last harvest when there are no harvests', () => {
    const [, , lastHarvest] = mapper.toMessages(topics, 's1', {
      plantCount: 0,
      harvestCount: 0,
      lastHarvestAt: null,
      inventoryItemCount: 0,
      lowStockCount: 0,
    });
    expect(lastHarvest.state).toBe('None');
  });
});

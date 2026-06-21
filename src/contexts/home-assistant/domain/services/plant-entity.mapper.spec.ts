import { HaTopicFactory } from './ha-topic.factory';
import { PlantEntityMapper } from './plant-entity.mapper';

describe('PlantEntityMapper', () => {
  const topics = new HaTopicFactory('gardenia', 'homeassistant');
  const mapper = new PlantEntityMapper();

  it('maps a watered plant to a discovery + state message', () => {
    const [message] = mapper.toMessages(topics, 's1', {
      plantId: 'p1',
      name: 'Fern',
      lastWateredAt: new Date('2026-06-01T10:00:00.000Z'),
    });

    expect(message.configTopic).toBe(
      'homeassistant/sensor/gardenia_s1/plant_p1_last_watered/config',
    );
    expect(message.stateTopic).toBe('gardenia/s1/plant/p1/last_watered/state');
    expect(message.state).toBe('2026-06-01T10:00:00.000Z');
    expect(message.config).toMatchObject({
      unique_id: 'gardenia_s1_plant_p1_last_watered',
      device_class: 'timestamp',
      state_topic: 'gardenia/s1/plant/p1/last_watered/state',
      availability_topic: 'gardenia/s1/bridge/availability',
    });
    expect(message.config.device).toMatchObject({ name: 'Fern' });
  });

  it('emits "None" state when the plant was never watered', () => {
    const [message] = mapper.toMessages(topics, 's1', {
      plantId: 'p2',
      name: 'Cactus',
      lastWateredAt: null,
    });
    expect(message.state).toBe('None');
  });
});

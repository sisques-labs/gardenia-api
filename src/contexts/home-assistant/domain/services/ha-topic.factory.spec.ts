import { HaTopicFactory } from './ha-topic.factory';

describe('HaTopicFactory', () => {
  const topics = new HaTopicFactory('gardenia', 'homeassistant');

  it('namespaces state topics by space', () => {
    expect(topics.state('s1', 'plant', 'p1', 'last_watered')).toBe(
      'gardenia/s1/plant/p1/last_watered/state',
    );
  });

  it('namespaces command topics by space', () => {
    expect(topics.command('s1', 'plant', 'p1', 'water')).toBe(
      'gardenia/s1/plant/p1/water/set',
    );
  });

  it('builds the discovery config topic under the discovery prefix', () => {
    expect(topics.discoveryConfig('sensor', 'gardenia_s1', 'plant_p1')).toBe(
      'homeassistant/sensor/gardenia_s1/plant_p1/config',
    );
  });

  it('builds a per-space availability topic and node id', () => {
    expect(topics.availability('s1')).toBe('gardenia/s1/bridge/availability');
    expect(topics.node('s1')).toBe('gardenia_s1');
  });

  it('rejects an empty space id', () => {
    expect(() => topics.state('', 'plant')).toThrow();
  });

  it('rejects empty construction config', () => {
    expect(() => new HaTopicFactory('', 'homeassistant')).toThrow();
    expect(() => new HaTopicFactory('gardenia', '')).toThrow();
  });
});

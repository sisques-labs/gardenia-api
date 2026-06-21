import { HaTopicFactory } from './ha-topic.factory';
import { WeatherEntityMapper } from './weather-entity.mapper';

describe('WeatherEntityMapper', () => {
  const topics = new HaTopicFactory('gardenia', 'homeassistant');
  const mapper = new WeatherEntityMapper();

  it('maps today forecast to temperature + precipitation sensors', () => {
    const messages = mapper.toMessages(topics, 's1', {
      temperatureMin: 8,
      temperatureMax: 21,
      precipitation: 3.5,
    });

    const byTopic = Object.fromEntries(messages.map((m) => [m.stateTopic, m]));

    const max = byTopic['gardenia/s1/weather/temperature_max/state'];
    expect(max.state).toBe('21');
    expect(max.config).toMatchObject({
      device_class: 'temperature',
      unit_of_measurement: '°C',
    });

    expect(byTopic['gardenia/s1/weather/precipitation/state'].state).toBe(
      '3.5',
    );
    expect(
      byTopic['gardenia/s1/weather/precipitation/state'].config
        .unit_of_measurement,
    ).toBe('mm');
  });
});

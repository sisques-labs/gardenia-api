import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { WeatherHaState } from '@contexts/home-assistant/domain/interfaces/weather-ha-state.interface';
import { HaSensorBuilder } from '@contexts/home-assistant/domain/services/ha-sensor.builder';
import { hubDevice } from '@contexts/home-assistant/domain/services/space-summary.mapper';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

/**
 * Maps today's forecast onto the space hub device's weather sensors. Emitted
 * only when the space has geolocation (the adapter returns null otherwise).
 */
export class WeatherEntityMapper {
  private readonly sensors = new HaSensorBuilder();

  toMessages(
    topics: HaTopicFactory,
    spaceId: string,
    weather: WeatherHaState,
  ): HaDiscoveryMessage[] {
    const device = hubDevice(topics, spaceId);

    return [
      this.sensors.build(topics, spaceId, {
        objectId: 'weather_temperature_max',
        name: 'Temperature (max)',
        deviceClass: 'temperature',
        unit: '°C',
        stateSegments: ['weather', 'temperature_max'],
        state: String(weather.temperatureMax),
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'weather_temperature_min',
        name: 'Temperature (min)',
        deviceClass: 'temperature',
        unit: '°C',
        stateSegments: ['weather', 'temperature_min'],
        state: String(weather.temperatureMin),
        device,
      }),
      this.sensors.build(topics, spaceId, {
        objectId: 'weather_precipitation',
        name: 'Precipitation',
        unit: 'mm',
        stateSegments: ['weather', 'precipitation'],
        state: String(weather.precipitation),
        device,
      }),
    ];
  }
}

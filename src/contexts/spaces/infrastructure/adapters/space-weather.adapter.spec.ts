import { QueryBus } from '@nestjs/cqrs';

import { GetWeatherForecastQuery } from '@contexts/weather/application/queries/get-weather-forecast/get-weather-forecast.query';
import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

import { SpaceWeatherAdapter } from './space-weather.adapter';

describe('SpaceWeatherAdapter', () => {
  const weatherForecast: IWeatherForecast = {
    latitude: 40.4168,
    longitude: -3.7038,
    timezone: 'Europe/Madrid',
    daily: [
      {
        date: '2026-06-20',
        temperatureMin: 14,
        temperatureMax: 29,
        precipitationSum: 0,
        weatherCode: 1,
      },
    ],
  };

  it('dispatches GetWeatherForecastQuery with the given coordinates', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(weatherForecast),
    } as unknown as jest.Mocked<QueryBus>;

    const adapter = new SpaceWeatherAdapter(queryBus);

    await adapter.getForecast(40.4168, -3.7038);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetWeatherForecastQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as GetWeatherForecastQuery;
    expect(query.latitude.value).toBe(40.4168);
    expect(query.longitude.value).toBe(-3.7038);
  });

  it('maps the weather forecast onto the spaces-local forecast shape', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue(weatherForecast),
    } as unknown as jest.Mocked<QueryBus>;

    const adapter = new SpaceWeatherAdapter(queryBus);

    const result = await adapter.getForecast(40.4168, -3.7038);

    expect(result).toEqual({
      latitude: 40.4168,
      longitude: -3.7038,
      timezone: 'Europe/Madrid',
      daily: [
        {
          date: '2026-06-20',
          temperatureMin: 14,
          temperatureMax: 29,
          precipitationSum: 0,
          weatherCode: 1,
        },
      ],
    });
  });
});

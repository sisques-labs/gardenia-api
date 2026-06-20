import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ISpaceWeatherForecast } from '@contexts/spaces/application/ports/space-weather-forecast.interface';
import { ISpaceWeatherPort } from '@contexts/spaces/application/ports/space-weather.port';
import { GetWeatherForecastQuery } from '@contexts/weather/application/queries/get-weather-forecast/get-weather-forecast.query';
import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

@Injectable()
export class SpaceWeatherAdapter implements ISpaceWeatherPort {
  constructor(private readonly queryBus: QueryBus) {}

  async getForecast(
    latitude: number,
    longitude: number,
  ): Promise<ISpaceWeatherForecast> {
    const forecast = await this.queryBus.execute<
      GetWeatherForecastQuery,
      IWeatherForecast
    >(new GetWeatherForecastQuery({ latitude, longitude }));

    return this.toSpaceForecast(forecast);
  }

  private toSpaceForecast(forecast: IWeatherForecast): ISpaceWeatherForecast {
    return {
      latitude: forecast.latitude,
      longitude: forecast.longitude,
      timezone: forecast.timezone,
      daily: forecast.daily.map((day) => ({
        date: day.date,
        temperatureMin: day.temperatureMin,
        temperatureMax: day.temperatureMax,
        precipitationSum: day.precipitationSum,
        weatherCode: day.weatherCode,
      })),
    };
  }
}

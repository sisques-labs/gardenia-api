import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ISpaceWeatherPort } from '@contexts/spaces/application/ports/space-weather.port';
import { GetWeatherForecastQuery } from '@contexts/weather/application/queries/get-weather-forecast/get-weather-forecast.query';
import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

@Injectable()
export class SpaceWeatherAdapter implements ISpaceWeatherPort {
  constructor(private readonly queryBus: QueryBus) {}

  async getForecast(latitude: number, longitude: number): Promise<IWeatherForecast> {
    return this.queryBus.execute(new GetWeatherForecastQuery({ latitude, longitude }));
  }
}

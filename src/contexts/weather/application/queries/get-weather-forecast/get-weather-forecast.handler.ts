import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WEATHER_PORT, IWeatherPort } from '@contexts/weather/application/ports/weather.port';
import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

import { GetWeatherForecastQuery } from './get-weather-forecast.query';

@QueryHandler(GetWeatherForecastQuery)
export class GetWeatherForecastQueryHandler
  implements IQueryHandler<GetWeatherForecastQuery, IWeatherForecast>
{
  private readonly logger = new Logger(GetWeatherForecastQueryHandler.name);

  constructor(
    @Inject(WEATHER_PORT)
    private readonly weatherPort: IWeatherPort,
  ) {}

  async execute(query: GetWeatherForecastQuery): Promise<IWeatherForecast> {
    this.logger.log(
      `Getting forecast for lat=${query.latitude.value}, lon=${query.longitude.value}`,
    );
    return this.weatherPort.getForecast(query.latitude.value, query.longitude.value);
  }
}

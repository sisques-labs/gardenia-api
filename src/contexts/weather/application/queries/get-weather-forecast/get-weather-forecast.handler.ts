import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WEATHER_PORT, IWeatherPort } from '@contexts/weather/application/ports/weather.port';
import { WeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

import { GetWeatherForecastQuery } from './get-weather-forecast.query';

@QueryHandler(GetWeatherForecastQuery)
export class GetWeatherForecastQueryHandler
  implements IQueryHandler<GetWeatherForecastQuery, WeatherForecast>
{
  private readonly logger = new Logger(GetWeatherForecastQueryHandler.name);

  constructor(
    @Inject(WEATHER_PORT)
    private readonly weatherPort: IWeatherPort,
  ) {}

  async execute(query: GetWeatherForecastQuery): Promise<WeatherForecast> {
    this.logger.log(`Getting forecast for lat=${query.latitude}, lon=${query.longitude}`);
    return this.weatherPort.getForecast(query.latitude, query.longitude);
  }
}

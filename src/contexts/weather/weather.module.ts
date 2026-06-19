import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WEATHER_PORT } from './application/ports/weather.port';
import { GetWeatherForecastQueryHandler } from './application/queries/get-weather-forecast/get-weather-forecast.handler';
import { OpenMeteoAdapter } from './infrastructure/adapters/open-meteo.adapter';

const QUERY_HANDLERS = [GetWeatherForecastQueryHandler];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: WEATHER_PORT, useClass: OpenMeteoAdapter },
];

@Module({
  imports: [CqrsModule],
  providers: [...QUERY_HANDLERS, ...INFRASTRUCTURE_ADAPTERS],
  exports: [],
})
export class WeatherModule {}

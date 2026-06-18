import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { WEATHER_PORT } from './application/ports/weather.port';
import { GetWeatherForecastQueryHandler } from './application/queries/get-weather-forecast/get-weather-forecast.handler';
import { OpenMeteoAdapter } from './infrastructure/adapters/open-meteo.adapter';

@Module({
  imports: [CqrsModule],
  providers: [
    {
      provide: WEATHER_PORT,
      useClass: OpenMeteoAdapter,
    },
    GetWeatherForecastQueryHandler,
  ],
  exports: [
    {
      provide: WEATHER_PORT,
      useClass: OpenMeteoAdapter,
    },
    GetWeatherForecastQueryHandler,
  ],
})
export class WeatherModule {}

import { Module } from '@nestjs/common';

import { WEATHER_PORT } from './application/ports/weather.port';
import { OpenMeteoAdapter } from './infrastructure/adapters/open-meteo.adapter';

@Module({
  providers: [
    {
      provide: WEATHER_PORT,
      useClass: OpenMeteoAdapter,
    },
  ],
  exports: [
    {
      provide: WEATHER_PORT,
      useClass: OpenMeteoAdapter,
    },
  ],
})
export class WeatherModule {}

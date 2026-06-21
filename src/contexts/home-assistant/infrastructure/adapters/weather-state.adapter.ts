import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { IWeatherStatePort } from '@contexts/home-assistant/application/ports/weather-state.port';
import { WeatherHaState } from '@contexts/home-assistant/domain/interfaces/weather-ha-state.interface';
import { ISpaceWeatherForecast } from '@contexts/spaces/application/ports/space-weather-forecast.interface';
import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';

/**
 * Reads today's forecast for a space via the Query bus. Returns null when the
 * space has no geolocation (the spaces query throws) so the bridge simply
 * omits weather sensors instead of failing the whole reconcile.
 */
@Injectable()
export class WeatherStateAdapter implements IWeatherStatePort {
  private readonly logger = new Logger(WeatherStateAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async getWeather(spaceId: string): Promise<WeatherHaState | null> {
    try {
      const forecast = await this.queryBus.execute<
        GetSpaceWeatherQuery,
        ISpaceWeatherForecast
      >(new GetSpaceWeatherQuery({ spaceId }));

      const today = forecast.daily[0];
      if (!today) return null;

      return {
        temperatureMin: today.temperatureMin,
        temperatureMax: today.temperatureMax,
        precipitation: today.precipitationSum,
      };
    } catch (error) {
      this.logger.debug(
        `No weather for space ${spaceId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}

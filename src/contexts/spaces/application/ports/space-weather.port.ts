import { ISpaceWeatherForecast } from '@contexts/spaces/application/ports/space-weather-forecast.interface';

export const SPACE_WEATHER_PORT = Symbol('SPACE_WEATHER_PORT');

export interface ISpaceWeatherPort {
  getForecast(
    latitude: number,
    longitude: number,
  ): Promise<ISpaceWeatherForecast>;
}

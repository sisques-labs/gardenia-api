import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

export const SPACE_WEATHER_PORT = Symbol('SPACE_WEATHER_PORT');

export interface ISpaceWeatherPort {
  getForecast(latitude: number, longitude: number): Promise<IWeatherForecast>;
}

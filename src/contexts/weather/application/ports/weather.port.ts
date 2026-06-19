import { IWeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';

export const WEATHER_PORT = Symbol('WEATHER_PORT');

export interface IWeatherPort {
  getForecast(latitude: number, longitude: number): Promise<IWeatherForecast>;
}

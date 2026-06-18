import { IDailyForecast } from './daily-forecast.interface';

export interface IWeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: IDailyForecast[];
}

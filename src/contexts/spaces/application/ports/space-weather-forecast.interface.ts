import { ISpaceDailyForecast } from '@contexts/spaces/application/ports/space-daily-forecast.interface';

/**
 * Spaces-owned forecast shape returned by {@link ISpaceWeatherPort}.
 *
 * Mirrors the data the `weather` context produces, but is declared inside
 * `spaces` so the port contract and its consumers never depend on
 * `@contexts/weather`. The adapter is the only place that maps the weather
 * context's view onto this type.
 */
export interface ISpaceWeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: ISpaceDailyForecast[];
}

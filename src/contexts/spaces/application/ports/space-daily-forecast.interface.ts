/**
 * Spaces-owned daily forecast entry. Declared inside `spaces` so the weather
 * port contract never depends on `@contexts/weather`; the adapter maps the
 * weather context's view onto this type.
 */
export interface ISpaceDailyForecast {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitationSum: number;
  weatherCode: number;
}

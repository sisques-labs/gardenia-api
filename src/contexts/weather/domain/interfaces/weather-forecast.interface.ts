export interface DailyForecast {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitationSum: number;
  weatherCode: number;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: DailyForecast[];
}

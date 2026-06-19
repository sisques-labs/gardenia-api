import { WeatherLatitudeValueObject } from '@contexts/weather/domain/value-objects/weather-latitude/weather-latitude.value-object';
import { WeatherLongitudeValueObject } from '@contexts/weather/domain/value-objects/weather-longitude/weather-longitude.value-object';

export type GetWeatherForecastQueryInput = { latitude: number; longitude: number };

export class GetWeatherForecastQuery {
  public readonly latitude: WeatherLatitudeValueObject;
  public readonly longitude: WeatherLongitudeValueObject;

  constructor(input: GetWeatherForecastQueryInput) {
    this.latitude = new WeatherLatitudeValueObject(input.latitude);
    this.longitude = new WeatherLongitudeValueObject(input.longitude);
  }
}

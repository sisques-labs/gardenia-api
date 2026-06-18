export type GetWeatherForecastQueryInput = { latitude: number; longitude: number };

export class GetWeatherForecastQuery {
  public readonly latitude: number;
  public readonly longitude: number;

  constructor(input: GetWeatherForecastQueryInput) {
    this.latitude = input.latitude;
    this.longitude = input.longitude;
  }
}

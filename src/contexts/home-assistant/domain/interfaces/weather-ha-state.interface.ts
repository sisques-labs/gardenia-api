/** Today's forecast for a space, surfaced as Home Assistant sensors. */
export interface WeatherHaState {
  temperatureMin: number;
  temperatureMax: number;
  precipitation: number;
}

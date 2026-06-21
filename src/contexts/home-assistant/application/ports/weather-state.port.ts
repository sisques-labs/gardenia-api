import { WeatherHaState } from '@contexts/home-assistant/domain/interfaces/weather-ha-state.interface';

export const WEATHER_STATE_PORT = Symbol('WEATHER_STATE_PORT');

/** Reads today's forecast for a space, or null when it has no geolocation. */
export interface IWeatherStatePort {
  getWeather(spaceId: string): Promise<WeatherHaState | null>;
}

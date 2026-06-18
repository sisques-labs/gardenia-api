import { Injectable, Logger } from '@nestjs/common';

import { IWeatherPort } from '@contexts/weather/application/ports/weather.port';
import {
  DailyForecast,
  WeatherForecast,
} from '@contexts/weather/domain/interfaces/weather-forecast.interface';

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
  };
}

interface CacheEntry {
  data: WeatherForecast;
  expiresAt: number;
}

const CACHE_TTL_MS = 3_600_000; // 1 hour

@Injectable()
export class OpenMeteoAdapter implements IWeatherPort {
  private readonly logger = new Logger(OpenMeteoAdapter.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    const key = `${latitude},${longitude}`;
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      this.logger.debug(`Cache hit for ${key}`);
      return cached.data;
    }

    this.logger.log(`Fetching weather from Open-Meteo for ${key}`);

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}` +
      `&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&timezone=auto` +
      `&forecast_days=7`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Open-Meteo request failed: ${response.status} ${response.statusText}`,
      );
    }

    const raw = (await response.json()) as OpenMeteoResponse;

    const daily: DailyForecast[] = raw.daily.time.map((date, i) => ({
      date,
      temperatureMin: raw.daily.temperature_2m_min[i],
      temperatureMax: raw.daily.temperature_2m_max[i],
      precipitationSum: raw.daily.precipitation_sum[i],
      weatherCode: raw.daily.weathercode[i],
    }));

    const forecast: WeatherForecast = {
      latitude: raw.latitude,
      longitude: raw.longitude,
      timezone: raw.timezone,
      daily,
    };

    this.cache.set(key, { data: forecast, expiresAt: Date.now() + CACHE_TTL_MS });

    return forecast;
  }
}

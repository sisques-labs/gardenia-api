import { z } from 'zod';

/** Input schema for the `weather_get_forecast` MCP tool. */
export const getWeatherForecastSchema = {
  latitude: z.number().min(-90).max(90).describe('Latitude in decimal degrees'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe('Longitude in decimal degrees'),
};

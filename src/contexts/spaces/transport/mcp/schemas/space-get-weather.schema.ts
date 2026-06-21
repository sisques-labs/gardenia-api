import { z } from 'zod';

/** Input schema for the `space_get_weather` MCP tool. */
export const spaceGetWeatherSchema = {
  spaceId: z.string().uuid().describe('Id of the space'),
};

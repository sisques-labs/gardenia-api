import { z } from 'zod';

/** Input schema for the `planting_spot_water` MCP tool. */
export const plantingSpotWaterSchema = {
  id: z.string().uuid().describe('Id of the planting spot to water'),
  performedAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe(
      'ISO timestamp of when the plants were watered (defaults to now)',
    ),
};

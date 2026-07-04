import { z } from 'zod';

/** Input schema for the `planting_spot_mark_active` MCP tool. */
export const plantingSpotMarkActiveSchema = {
  id: z.string().uuid().describe('Id of the planting spot to mark active'),
};

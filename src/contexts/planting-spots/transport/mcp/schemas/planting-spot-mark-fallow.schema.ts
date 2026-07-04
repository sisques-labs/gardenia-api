import { z } from 'zod';

/** Input schema for the `planting_spot_mark_fallow` MCP tool. */
export const plantingSpotMarkFallowSchema = {
  id: z.string().uuid().describe('Id of the planting spot to mark fallow'),
};

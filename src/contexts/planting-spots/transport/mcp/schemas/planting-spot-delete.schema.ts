import { z } from 'zod';

/** Input schema for the `planting_spot_delete` MCP tool. */
export const plantingSpotDeleteSchema = {
  id: z.string().uuid().describe('Id of the planting spot to delete'),
};

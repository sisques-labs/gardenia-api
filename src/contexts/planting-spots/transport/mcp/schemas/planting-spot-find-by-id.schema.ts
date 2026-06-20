import { z } from 'zod';

/** Input schema for the `planting_spot_find_by_id` MCP tool. */
export const plantingSpotFindByIdSchema = {
  id: z.string().uuid().describe('Id of the planting spot'),
};

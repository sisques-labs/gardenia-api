import { z } from 'zod';

/** Input schema for the `plant_find_by_id` MCP tool. */
export const plantFindByIdSchema = {
  id: z.string().uuid().describe('The unique identifier of the plant'),
};

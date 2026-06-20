import { z } from 'zod';

/** Input schema for the `plant_delete` MCP tool. */
export const plantDeleteSchema = {
  id: z.string().uuid().describe('The id of the plant to delete'),
};

import { z } from 'zod';

/** Input schema for the `harvest_delete` MCP tool. */
export const harvestDeleteSchema = {
  id: z.string().uuid().describe('Id of the harvest to delete'),
};

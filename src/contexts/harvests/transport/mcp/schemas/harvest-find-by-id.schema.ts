import { z } from 'zod';

/** Input schema for the `harvest_find_by_id` MCP tool. */
export const harvestFindByIdSchema = {
  id: z.string().uuid().describe('Id of the harvest'),
};

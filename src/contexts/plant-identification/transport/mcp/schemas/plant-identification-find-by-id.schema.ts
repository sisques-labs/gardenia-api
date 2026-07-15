import { z } from 'zod';

/** Input schema for the `plant_identification_find_by_id` MCP tool. */
export const plantIdentificationFindByIdSchema = {
  id: z.string().uuid().describe('Id of the plant identification'),
};

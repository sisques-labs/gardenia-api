import { z } from 'zod';

/** Input schema for the `plant_species_find_by_id` MCP tool. */
export const plantSpeciesFindByIdSchema = {
  plantSpeciesId: z.string().uuid().describe('Id of the plant species'),
};

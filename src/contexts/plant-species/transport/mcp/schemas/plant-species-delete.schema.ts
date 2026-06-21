import { z } from 'zod';

/** Input schema for the `plant_species_delete` MCP tool. */
export const plantSpeciesDeleteSchema = {
  id: z.string().uuid().describe('Id of the plant species to delete'),
};

import { z } from 'zod';

/** Input schema for the `plant_species_update` MCP tool. */
export const plantSpeciesUpdateSchema = {
  id: z.string().uuid().describe('Id of the plant species to update'),
  scientificName: z.string().min(1).optional().describe('New scientific name'),
  gbifKey: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('New GBIF usageKey identifying the species'),
};

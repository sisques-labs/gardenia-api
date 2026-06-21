import { z } from 'zod';

/** Input schema for the `plant_species_update` MCP tool. */
export const plantSpeciesUpdateSchema = {
  id: z.string().uuid().describe('Id of the plant species to update'),
  scientificName: z.string().min(1).optional().describe('New scientific name'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('New description, or null to clear'),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('New image URL, or null to clear'),
};

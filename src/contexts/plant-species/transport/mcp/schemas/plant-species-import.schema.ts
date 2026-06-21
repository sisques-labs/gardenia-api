import { z } from 'zod';

/** Input schema for the `plant_species_import` MCP tool. */
export const plantSpeciesImportSchema = {
  limit: z
    .number()
    .int()
    .positive()
    .describe('Maximum number of species to import'),
  offset: z
    .number()
    .int()
    .nonnegative()
    .describe('Offset into the external catalog'),
};

import { z } from 'zod';

/** Input schema for the `plant_species_search` MCP tool. */
export const gbifSpeciesSearchSchema = {
  name: z.string().min(1).describe('Species name to search for'),
  limit: z
    .number()
    .int()
    .positive()
    .max(20)
    .optional()
    .describe('Maximum number of suggestions to return (default 10, max 20)'),
};

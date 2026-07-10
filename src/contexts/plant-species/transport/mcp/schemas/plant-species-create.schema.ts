import { z } from 'zod';

/** Input schema for the `plant_species_create` MCP tool. */
export const plantSpeciesCreateSchema = {
  scientificName: z
    .string()
    .min(1)
    .describe('Scientific (botanical) name of the species'),
  gbifKey: z
    .number()
    .int()
    .positive()
    .describe("GBIF's numeric usageKey identifying the species"),
};

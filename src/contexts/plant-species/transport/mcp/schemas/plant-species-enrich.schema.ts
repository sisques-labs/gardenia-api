import { z } from 'zod';

/** Input schema for the `plant_species_enrich` MCP tool. */
export const plantSpeciesEnrichSchema = {
  scientificName: z
    .string()
    .min(1)
    .describe('Scientific name of the species to enrich with external data'),
};

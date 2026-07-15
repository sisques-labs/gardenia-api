import { z } from 'zod';

/** Input schema for the `plant_create` MCP tool. */
export const plantCreateSchema = {
  name: z.string().min(1).describe('Display name of the plant'),
  gbifSpeciesKey: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Optional GBIF usageKey of the species to link (from a live search result)',
    ),
  speciesScientificName: z
    .string()
    .min(1)
    .optional()
    .describe(
      'Optional scientific name of the species to link, as chosen from a live search result',
    ),
  imageUrl: z
    .string()
    .url()
    .optional()
    .describe('Optional image URL for the plant'),
};

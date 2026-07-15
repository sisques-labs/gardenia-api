import { z } from 'zod';

/** Input schema for the `plant_update` MCP tool. */
export const plantUpdateSchema = {
  id: z.string().uuid().describe('The id of the plant to update'),
  name: z.string().min(1).optional().describe('New display name'),
  gbifSpeciesKey: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe(
      'New GBIF usageKey of the species to link (from a live search result), or null to unlink',
    ),
  speciesScientificName: z
    .string()
    .min(1)
    .nullable()
    .optional()
    .describe(
      'New scientific name of the species to link, as chosen from a live search result, or null to unlink',
    ),
  imageUrl: z
    .string()
    .url()
    .nullable()
    .optional()
    .describe('New image URL, or null to remove'),
  plantingSpotId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('New planting spot id to assign, or null to unassign'),
};

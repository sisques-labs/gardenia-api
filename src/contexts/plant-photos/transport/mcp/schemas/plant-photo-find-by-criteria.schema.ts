import { z } from 'zod';

/** Input schema for the `plant_photo_find_by_criteria` MCP tool. */
export const plantPhotoFindByCriteriaSchema = {
  plantId: z.string().uuid().optional().describe('Filter by plant id'),
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};

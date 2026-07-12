import { z } from 'zod';

/** Input schema for the `node_find_by_criteria` MCP tool. */
export const nodeFindByCriteriaSchema = {
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};

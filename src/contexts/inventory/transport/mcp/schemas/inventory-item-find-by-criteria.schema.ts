import { z } from 'zod';

/** Input schema for the `inventory_item_find_by_criteria` MCP tool. */
export const inventoryItemFindByCriteriaSchema = {
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};

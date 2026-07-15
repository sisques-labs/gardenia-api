import { z } from 'zod';

/** Input schema for the `inventory_item_delete_bulk` MCP tool. */
export const inventoryItemDeleteBulkSchema = {
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(100)
    .describe('Ids of the inventory items to delete (1-100)'),
};

import { z } from 'zod';

/** Input schema for the `inventory_item_find_by_id` MCP tool. */
export const inventoryItemFindByIdSchema = {
  id: z.string().uuid().describe('Id of the inventory item'),
};

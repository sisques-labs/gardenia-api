import { z } from 'zod';

/** Input schema for the `inventory_item_delete` MCP tool. */
export const inventoryItemDeleteSchema = {
  id: z.string().uuid().describe('Id of the inventory item to delete'),
};

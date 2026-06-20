import { z } from 'zod';

/** Input schema for the `inventory_item_adjust_quantity` MCP tool. */
export const inventoryItemAdjustQuantitySchema = {
  id: z.string().uuid().describe('Id of the inventory item'),
  delta: z
    .number()
    .describe('Signed quantity change (positive to add, negative to remove)'),
  reason: z.string().min(1).describe('Reason for the adjustment'),
};

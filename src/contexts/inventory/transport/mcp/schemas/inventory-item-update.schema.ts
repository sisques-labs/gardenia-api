import { z } from 'zod';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

/** Input schema for the `inventory_item_update` MCP tool. */
export const inventoryItemUpdateSchema = {
  id: z.string().uuid().describe('Id of the inventory item to update'),
  itemType: z.nativeEnum(InventoryItemTypeEnum).optional().describe('New type'),
  name: z.string().min(1).optional().describe('New name'),
  brand: z
    .string()
    .nullable()
    .optional()
    .describe('New brand, or null to clear'),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe('New notes, or null to clear'),
  unit: z.nativeEnum(InventoryUnitEnum).optional().describe('New unit'),
  lowStockThreshold: z
    .number()
    .nullable()
    .optional()
    .describe('New low-stock threshold, or null to clear'),
  acquiredAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('New acquisition timestamp, or null to clear'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('New expiry timestamp, or null to clear'),
};

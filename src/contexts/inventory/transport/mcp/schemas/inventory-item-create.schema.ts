import { z } from 'zod';

import { InventoryItemTypeEnum } from '@contexts/inventory/domain/enums/inventory-item-type.enum';
import { InventoryUnitEnum } from '@contexts/inventory/domain/enums/inventory-unit.enum';

/** Input schema for the `inventory_item_create` MCP tool. */
export const inventoryItemCreateSchema = {
  itemType: z.nativeEnum(InventoryItemTypeEnum).describe('Type of item'),
  name: z.string().min(1).describe('Item name'),
  quantity: z.number().describe('Initial quantity in stock'),
  unit: z.nativeEnum(InventoryUnitEnum).describe('Unit of the quantity'),
  brand: z.string().nullable().optional().describe('Brand'),
  notes: z.string().nullable().optional().describe('Free-text notes'),
  lowStockThreshold: z
    .number()
    .nullable()
    .optional()
    .describe('Quantity below which the item is considered low stock'),
  acquiredAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('ISO timestamp of acquisition'),
  expiresAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('ISO timestamp of expiry'),
};

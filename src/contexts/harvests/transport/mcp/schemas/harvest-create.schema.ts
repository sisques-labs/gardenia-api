import { z } from 'zod';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

/** Input schema for the `harvest_create` MCP tool. */
export const harvestCreateSchema = {
  cropType: z.string().min(1).describe('Type of crop harvested'),
  quantity: z.number().describe('Amount harvested'),
  unit: z.nativeEnum(HarvestUnitEnum).describe('Unit of the quantity'),
  harvestedAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO timestamp of the harvest (defaults to now)'),
};

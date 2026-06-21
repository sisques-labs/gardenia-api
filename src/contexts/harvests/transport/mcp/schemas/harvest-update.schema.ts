import { z } from 'zod';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';

/** Input schema for the `harvest_update` MCP tool. */
export const harvestUpdateSchema = {
  id: z.string().uuid().describe('Id of the harvest to update'),
  cropType: z.string().min(1).optional().describe('New crop type'),
  quantity: z.number().optional().describe('New quantity'),
  unit: z.nativeEnum(HarvestUnitEnum).optional().describe('New unit'),
  harvestedAt: z
    .string()
    .datetime()
    .optional()
    .describe('New ISO timestamp of the harvest'),
};

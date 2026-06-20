import { z } from 'zod';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

/** Input schema for the `planting_spot_update` MCP tool. */
export const plantingSpotUpdateSchema = {
  id: z.string().uuid().describe('Id of the planting spot to update'),
  name: z.string().min(1).optional().describe('New name'),
  type: z.nativeEnum(PlantingSpotTypeEnum).optional().describe('New type'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('New description, or null to clear'),
  capacity: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('New capacity, or null to clear'),
  row: z.number().int().nullable().optional().describe('New row, or null'),
  column: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('New column, or null'),
  dimensionsWidth: z.number().nullable().optional().describe('New width'),
  dimensionsHeight: z.number().nullable().optional().describe('New height'),
  dimensionsLength: z.number().nullable().optional().describe('New length'),
  soilType: z
    .string()
    .nullable()
    .optional()
    .describe('New soil type, or null to clear'),
};

import { z } from 'zod';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';

/** Input schema for the `planting_spot_create` MCP tool. */
export const plantingSpotCreateSchema = {
  name: z.string().min(1).describe('Display name of the planting spot'),
  type: z.nativeEnum(PlantingSpotTypeEnum).describe('Type of planting spot'),
  description: z
    .string()
    .nullable()
    .optional()
    .describe('Free-text description'),
  capacity: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('Maximum number of plants it can hold'),
  row: z.number().int().nullable().optional().describe('Grid row position'),
  column: z
    .number()
    .int()
    .nullable()
    .optional()
    .describe('Grid column position'),
  dimensionsWidth: z.number().nullable().optional().describe('Width'),
  dimensionsHeight: z.number().nullable().optional().describe('Height'),
  dimensionsLength: z.number().nullable().optional().describe('Length'),
  soilType: z.string().nullable().optional().describe('Soil type'),
};

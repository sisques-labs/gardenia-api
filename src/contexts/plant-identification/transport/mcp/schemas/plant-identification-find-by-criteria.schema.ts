import { z } from 'zod';

import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

/** Input schema for the `plant_identification_find_by_criteria` MCP tool. */
export const plantIdentificationFindByCriteriaSchema = {
  status: z
    .nativeEnum(PlantIdentificationStatusEnum)
    .optional()
    .describe('Filter by outcome status'),
  page: z.number().int().positive().optional().describe('1-based page number'),
  perPage: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe('Number of items per page (max 100)'),
};

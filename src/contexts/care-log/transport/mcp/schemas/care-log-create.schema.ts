import { z } from 'zod';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

/** Input schema for the `care_log_create` MCP tool. */
export const careLogCreateSchema = {
  plantId: z.string().uuid().describe('Id of the plant the entry refers to'),
  activityType: z
    .nativeEnum(CareLogActivityTypeEnum)
    .describe('Type of care activity performed'),
  performedAt: z
    .string()
    .datetime()
    .optional()
    .describe('ISO timestamp of when the activity was performed'),
  notes: z.string().nullable().optional().describe('Free-text notes'),
  quantity: z
    .number()
    .nullable()
    .optional()
    .describe('Amount applied (e.g. water/fertilizer quantity)'),
  unit: z
    .nativeEnum(CareLogUnitEnum)
    .nullable()
    .optional()
    .describe('Unit of the quantity'),
};

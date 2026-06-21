import { z } from 'zod';

import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';

/** Input schema for the `care_log_update` MCP tool. */
export const careLogUpdateSchema = {
  id: z.string().uuid().describe('Id of the care log entry to update'),
  activityType: z
    .nativeEnum(CareLogActivityTypeEnum)
    .optional()
    .describe('New activity type'),
  performedAt: z
    .string()
    .datetime()
    .optional()
    .describe('New ISO timestamp of when the activity was performed'),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe('New notes, or null to clear'),
  quantity: z
    .number()
    .nullable()
    .optional()
    .describe('New quantity, or null to clear'),
  unit: z
    .nativeEnum(CareLogUnitEnum)
    .nullable()
    .optional()
    .describe('New unit, or null to clear'),
};

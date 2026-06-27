import { z } from 'zod';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

/** Input schema for the `care_schedule_update` MCP tool. */
export const careScheduleUpdateSchema = {
  id: z.string().uuid().describe('Id of the care schedule to update'),
  activityType: z
    .nativeEnum(CareScheduleActivityTypeEnum)
    .optional()
    .describe('New activity type'),
  intervalDays: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('New interval in days (>= 1)'),
  quantity: z
    .number()
    .positive()
    .nullable()
    .optional()
    .describe('New dosage quantity, or null to clear'),
  unit: z
    .nativeEnum(CareScheduleUnitEnum)
    .nullable()
    .optional()
    .describe('New dosage unit, or null to clear'),
  notes: z
    .string()
    .nullable()
    .optional()
    .describe('New notes, or null to clear'),
  active: z.boolean().optional().describe('Whether the schedule is active'),
};

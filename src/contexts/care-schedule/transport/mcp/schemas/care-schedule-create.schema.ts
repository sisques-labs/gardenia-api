import { z } from 'zod';

import { CareScheduleActivityTypeEnum } from '@contexts/care-schedule/domain/enums/care-schedule-activity-type.enum';
import { CareScheduleUnitEnum } from '@contexts/care-schedule/domain/enums/care-schedule-unit.enum';

/** Input schema for the `care_schedule_create` MCP tool. */
export const careScheduleCreateSchema = {
  plantId: z.string().uuid().describe('Id of the plant to schedule care for'),
  activityType: z
    .nativeEnum(CareScheduleActivityTypeEnum)
    .describe('Type of care activity'),
  intervalDays: z
    .number()
    .int()
    .positive()
    .describe('Recurrence interval in days (>= 1)'),
  quantity: z
    .number()
    .positive()
    .nullable()
    .optional()
    .describe('Dosage quantity (> 0)'),
  unit: z
    .nativeEnum(CareScheduleUnitEnum)
    .nullable()
    .optional()
    .describe('Dosage unit'),
  notes: z.string().nullable().optional().describe('Free-text notes'),
  nextDueAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('ISO timestamp of the first due date (defaults to now)'),
  active: z
    .boolean()
    .nullable()
    .optional()
    .describe('Whether the schedule is active (defaults to true)'),
};

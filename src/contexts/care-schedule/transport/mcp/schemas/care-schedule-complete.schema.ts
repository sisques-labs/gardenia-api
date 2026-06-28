import { z } from 'zod';

/** Input schema for the `care_schedule_complete` MCP tool. */
export const careScheduleCompleteSchema = {
  id: z.string().uuid().describe('Id of the care schedule to complete'),
  completedAt: z
    .string()
    .datetime()
    .nullable()
    .optional()
    .describe('ISO timestamp of completion (defaults to now)'),
};

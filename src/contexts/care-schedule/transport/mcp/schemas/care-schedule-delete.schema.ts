import { z } from 'zod';

/** Input schema for the `care_schedule_delete` MCP tool. */
export const careScheduleDeleteSchema = {
  id: z.string().uuid().describe('Id of the care schedule to delete'),
};

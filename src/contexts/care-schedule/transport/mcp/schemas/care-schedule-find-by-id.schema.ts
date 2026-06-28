import { z } from 'zod';

/** Input schema for the `care_schedule_find_by_id` MCP tool. */
export const careScheduleFindByIdSchema = {
  id: z.string().uuid().describe('Id of the care schedule'),
};

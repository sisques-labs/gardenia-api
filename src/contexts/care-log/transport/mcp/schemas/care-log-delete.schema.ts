import { z } from 'zod';

/** Input schema for the `care_log_delete` MCP tool. */
export const careLogDeleteSchema = {
  id: z.string().uuid().describe('Id of the care log entry to delete'),
};

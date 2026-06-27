import { z } from 'zod';

/** Input schema for the `file_find_by_id` MCP tool. */
export const fileFindByIdSchema = {
  id: z.string().uuid().describe('Id of the file'),
};

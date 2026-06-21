import { z } from 'zod';

/** Input schema for the `user_find_by_id` MCP tool. */
export const userFindByIdSchema = {
  id: z.string().uuid().describe('Id of the user'),
};

import { z } from 'zod';

/** Input schema for the `file_delete` MCP tool. */
export const fileDeleteSchema = {
  id: z.string().uuid().describe('Id of the file to delete'),
};

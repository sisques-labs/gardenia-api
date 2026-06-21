import { z } from 'zod';

/** Input schema for the `space_find_by_id` MCP tool. */
export const spaceFindByIdSchema = {
  spaceId: z.string().uuid().describe('Id of the space'),
};

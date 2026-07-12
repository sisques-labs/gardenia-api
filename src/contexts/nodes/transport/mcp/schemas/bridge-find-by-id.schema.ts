import { z } from 'zod';

/** Input schema for the `bridge_find_by_id` MCP tool. */
export const bridgeFindByIdSchema = {
  bridgeId: z.string().uuid().describe('Id of the bridge'),
};

import { z } from 'zod';

/** Input schema for the `node_find_by_id` MCP tool. */
export const nodeFindByIdSchema = {
  nodeId: z.string().uuid().describe('Id of the node'),
};

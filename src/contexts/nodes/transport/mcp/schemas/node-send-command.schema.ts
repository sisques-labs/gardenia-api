import { z } from 'zod';

/** Input schema for the `node_send_command` MCP tool. */
export const nodeSendCommandSchema = {
  nodeId: z.string().uuid().describe('Id of the target node'),
  commandType: z
    .string()
    .describe('Opaque command type understood by the node'),
  payload: z.unknown().optional().describe('Opaque command payload'),
};

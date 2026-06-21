import { z } from 'zod';

/** Input schema for the `space_remove_member` MCP tool. */
export const spaceRemoveMemberSchema = {
  spaceId: z.string().uuid().describe('Id of the space'),
  targetUserId: z.string().uuid().describe('Id of the user to remove'),
};

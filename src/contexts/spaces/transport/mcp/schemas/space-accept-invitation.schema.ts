import { z } from 'zod';

/** Input schema for the `space_accept_invitation` MCP tool. */
export const spaceAcceptInvitationSchema = {
  code: z.string().min(1).describe('Invitation code to accept'),
};

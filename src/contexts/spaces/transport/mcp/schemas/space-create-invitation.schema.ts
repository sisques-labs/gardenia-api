import { z } from 'zod';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

/** Input schema for the `space_create_invitation` MCP tool. */
export const spaceCreateInvitationSchema = {
  spaceId: z.string().uuid().describe('Id of the space to invite to'),
  role: z
    .nativeEnum(MembershipRoleEnum)
    .optional()
    .describe('Role granted on acceptance (defaults to member)'),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .describe('Optional ISO expiry timestamp for the invitation'),
};

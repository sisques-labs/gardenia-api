import { z } from 'zod';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

/** Input schema for the `space_add_member` MCP tool. */
export const spaceAddMemberSchema = {
  spaceId: z.string().uuid().describe('Id of the space'),
  targetUserId: z.string().uuid().describe('Id of the user to add'),
  role: z
    .nativeEnum(MembershipRoleEnum)
    .optional()
    .describe('Role to grant (defaults to member)'),
};

import { BasePrimitives } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../enums/membership-role.enum';

export interface ISpaceInvitationPrimitives extends BasePrimitives {
  id: string;
  spaceId: string;
  createdByUserId: string;
  role: MembershipRoleEnum;
  code: string;
  displayCode: string;
  qrId: string | null;
  expiresAt: Date;
}

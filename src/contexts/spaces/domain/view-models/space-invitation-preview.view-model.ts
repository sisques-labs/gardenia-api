import { MembershipRoleEnum } from '../enums/membership-role.enum';

export interface SpaceInvitationPreviewViewModel {
  spaceName: string;
  role: MembershipRoleEnum;
  expiresAt: Date;
  isExpired: boolean;
}

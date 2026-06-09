import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { InvitationCodeValueObject } from '../value-objects/invitation-code/invitation-code.value-object';
import { InvitationDisplayCodeValueObject } from '../value-objects/invitation-display-code/invitation-display-code.value-object';
import { InvitationExpiresAtValueObject } from '../value-objects/invitation-expires-at/invitation-expires-at.value-object';
import { SpaceInvitationIdValueObject } from '../value-objects/space-invitation-id/space-invitation-id.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';

export interface ISpaceInvitation {
  id: SpaceInvitationIdValueObject;
  spaceId: SpaceIdValueObject;
  createdByUserId: UuidValueObject;
  role: MembershipRoleValueObject;
  code: InvitationCodeValueObject;
  displayCode: InvitationDisplayCodeValueObject;
  qrId: UuidValueObject | null;
  expiresAt: InvitationExpiresAtValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}

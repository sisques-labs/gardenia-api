import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';

export interface ISpaceMembership {
  userId: UuidValueObject;
  spaceId: SpaceIdValueObject;
  role: MembershipRoleValueObject;
  joinedAt: DateValueObject;
}

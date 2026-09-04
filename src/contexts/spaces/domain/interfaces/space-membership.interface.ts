import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';

export interface ISpaceMembership {
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  role: MembershipRoleValueObject;
  joinedAt: DateValueObject;
}

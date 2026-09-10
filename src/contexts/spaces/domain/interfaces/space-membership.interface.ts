import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';

export interface ISpaceMembership {
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  role: MembershipRoleValueObject;
  joinedAt: DateValueObject;
  /**
   * Last successful reconciliation against account-api's tenant-membership
   * API (design.md D4). `null` = "never synced" = treated as stale by
   * `MembershipProjectionSyncGuard`.
   */
  syncedAt?: Date | null;
}

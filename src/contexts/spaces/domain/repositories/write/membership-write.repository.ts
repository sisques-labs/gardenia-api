import { MembershipRoleEnum } from '../../enums/membership-role.enum';

export const MEMBERSHIP_WRITE_REPOSITORY = Symbol(
  'MEMBERSHIP_WRITE_REPOSITORY',
);

/**
 * Direct write access to the local membership PROJECTION (design.md D4) —
 * distinct from `ISpaceWriteRepository`, which persists membership rows only
 * as a side effect of saving a `SpaceAggregate` mutated by a domain command
 * (`addMember`/`removeMember`).
 *
 * `SyncSpaceMembershipProjectionCommandHandler` reconciles rows from an
 * EXTERNAL system (the platform's confirmed membership response), never from
 * a domain command — it MUST NOT go through the aggregate's business
 * invariants (duplicate-member, last-owner-removal) or emit
 * `MemberAdded`/`MemberRemoved` domain events, which would misrepresent an
 * external reconciliation as a user-initiated action.
 */
export interface IMembershipWriteRepository {
  upsert(
    userId: string,
    spaceId: string,
    role: MembershipRoleEnum,
    syncedAt: Date,
  ): Promise<void>;
  deleteByUserAndSpace(userId: string, spaceId: string): Promise<void>;
}

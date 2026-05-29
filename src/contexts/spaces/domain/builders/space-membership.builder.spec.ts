import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

import { SpaceMembershipBuilder } from './space-membership.builder';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const JOINED_AT = new Date('2024-01-01T00:00:00.000Z');

describe('SpaceMembershipBuilder', () => {
  let builder: SpaceMembershipBuilder;

  beforeEach(() => {
    builder = new SpaceMembershipBuilder();
  });

  it('should build a SpaceMembership with all fields', () => {
    const membership = builder
      .withUserId(USER_ID)
      .withSpaceId(SPACE_ID)
      .withRole(MembershipRoleEnum.OWNER)
      .withJoinedAt(JOINED_AT)
      .build();

    expect(membership).toBeInstanceOf(SpaceMembership);
    expect(membership.userId).toBe(USER_ID);
    expect(membership.spaceId).toBe(SPACE_ID);
    expect(membership.role.value).toBe(MembershipRoleEnum.OWNER);
    expect(membership.joinedAt).toEqual(JOINED_AT);
  });

  it('should build a member role membership', () => {
    const membership = builder
      .withUserId(USER_ID)
      .withSpaceId(SPACE_ID)
      .withRole(MembershipRoleEnum.MEMBER)
      .withJoinedAt(JOINED_AT)
      .build();

    expect(membership.role.value).toBe(MembershipRoleEnum.MEMBER);
  });

  it('should default joinedAt to now when not set', () => {
    const before = new Date();
    const membership = builder
      .withUserId(USER_ID)
      .withSpaceId(SPACE_ID)
      .withRole(MembershipRoleEnum.MEMBER)
      .build();
    const after = new Date();

    expect(membership.joinedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(membership.joinedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

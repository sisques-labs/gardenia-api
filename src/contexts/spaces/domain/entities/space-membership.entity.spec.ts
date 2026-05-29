import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { ISpaceMembership } from '../interfaces/space-membership.interface';
import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceMembership } from './space-membership.entity';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('SpaceMembership', () => {
  describe('create factory', () => {
    it('should create a membership with the given userId, spaceId and role', () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.OWNER,
      );

      expect(membership.userId).toBe(USER_ID);
      expect(membership.spaceId).toBe(SPACE_ID);
      expect(membership.role.value).toBe(MembershipRoleEnum.OWNER);
    });

    it('should set joinedAt automatically on create', () => {
      const before = new Date();
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.MEMBER,
      );
      const after = new Date();

      expect(membership.joinedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(membership.joinedAt.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it('should create a member role membership', () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.MEMBER,
      );
      expect(membership.role.value).toBe(MembershipRoleEnum.MEMBER);
      expect(membership.role.isOwner()).toBe(false);
    });

    it('should create an owner role membership', () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.OWNER,
      );
      expect(membership.role.isOwner()).toBe(true);
    });
  });

  describe('hydration constructor', () => {
    it('should allow constructing with all fields provided', () => {
      const joinedAt = new Date('2024-01-01');
      const props: ISpaceMembership = {
        userId: new UuidValueObject(USER_ID),
        spaceId: new SpaceIdValueObject(SPACE_ID),
        role: new MembershipRoleValueObject(MembershipRoleEnum.MEMBER),
        joinedAt: new DateValueObject(joinedAt),
      };
      const membership = new SpaceMembership(props);

      expect(membership.userId).toBe(USER_ID);
      expect(membership.spaceId).toBe(SPACE_ID);
      expect(membership.role.value).toBe(MembershipRoleEnum.MEMBER);
      expect(membership.joinedAt).toEqual(joinedAt);
    });
  });

  describe('invalid role', () => {
    it('should throw when creating with an invalid role string', () => {
      expect(() =>
        SpaceMembership.create(
          USER_ID,
          SPACE_ID,
          'admin' as MembershipRoleEnum,
        ),
      ).toThrow();
    });
  });
});

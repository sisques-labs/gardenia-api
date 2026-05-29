import {
  MembershipRole,
  MembershipRoleVO,
} from '../value-objects/membership-role/membership-role.vo';
import { SpaceMembership } from './space-membership.entity';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('SpaceMembership', () => {
  describe('create factory', () => {
    it('should create a membership with the given userId, spaceId and role', () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRole.OWNER,
      );

      expect(membership.userId).toBe(USER_ID);
      expect(membership.spaceId).toBe(SPACE_ID);
      expect(membership.role.value).toBe(MembershipRole.OWNER);
    });

    it('should set joinedAt automatically on create', () => {
      const before = new Date();
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRole.MEMBER,
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
        MembershipRole.MEMBER,
      );
      expect(membership.role.value).toBe(MembershipRole.MEMBER);
      expect(membership.role.isOwner()).toBe(false);
    });

    it('should create an owner role membership', () => {
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRole.OWNER,
      );
      expect(membership.role.isOwner()).toBe(true);
    });
  });

  describe('hydration constructor', () => {
    it('should allow constructing with all fields provided', () => {
      const joinedAt = new Date('2024-01-01');
      const role = new MembershipRoleVO(MembershipRole.MEMBER);
      const membership = new SpaceMembership({
        userId: USER_ID,
        spaceId: SPACE_ID,
        role,
        joinedAt,
      });

      expect(membership.userId).toBe(USER_ID);
      expect(membership.spaceId).toBe(SPACE_ID);
      expect(membership.role.value).toBe(MembershipRole.MEMBER);
      expect(membership.joinedAt).toBe(joinedAt);
    });
  });

  describe('invalid role', () => {
    it('should throw when creating with an invalid role string', () => {
      expect(() =>
        SpaceMembership.create(USER_ID, SPACE_ID, 'admin' as MembershipRole),
      ).toThrow();
    });
  });
});

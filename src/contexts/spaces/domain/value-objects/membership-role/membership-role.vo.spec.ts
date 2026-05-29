import { MembershipRoleVO, MembershipRole } from './membership-role.vo';

describe('MembershipRoleVO', () => {
  describe('valid values', () => {
    it('should accept "owner"', () => {
      const vo = new MembershipRoleVO(MembershipRole.OWNER);
      expect(vo.value).toBe('owner');
    });

    it('should accept "member"', () => {
      const vo = new MembershipRoleVO(MembershipRole.MEMBER);
      expect(vo.value).toBe('member');
    });
  });

  describe('invalid values', () => {
    it('should throw for an unknown role string', () => {
      expect(() => new MembershipRoleVO('admin' as MembershipRole)).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => new MembershipRoleVO('' as MembershipRole)).toThrow();
    });

    it('should throw for any arbitrary string', () => {
      expect(
        () => new MembershipRoleVO('superuser' as MembershipRole),
      ).toThrow();
    });
  });

  describe('helpers', () => {
    it('isOwner should return true for owner role', () => {
      const vo = new MembershipRoleVO(MembershipRole.OWNER);
      expect(vo.isOwner()).toBe(true);
    });

    it('isOwner should return false for member role', () => {
      const vo = new MembershipRoleVO(MembershipRole.MEMBER);
      expect(vo.isOwner()).toBe(false);
    });

    it('equals should return true for same role', () => {
      const vo1 = new MembershipRoleVO(MembershipRole.OWNER);
      const vo2 = new MembershipRoleVO(MembershipRole.OWNER);
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('equals should return false for different roles', () => {
      const vo1 = new MembershipRoleVO(MembershipRole.OWNER);
      const vo2 = new MembershipRoleVO(MembershipRole.MEMBER);
      expect(vo1.equals(vo2)).toBe(false);
    });
  });
});

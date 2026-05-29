import { MembershipRoleValueObject } from './membership-role.value-object';
import { MembershipRoleEnum } from '../../enums/membership-role.enum';

describe('MembershipRoleValueObject', () => {
  describe('valid values', () => {
    it('should accept owner role', () => {
      const vo = new MembershipRoleValueObject(MembershipRoleEnum.OWNER);
      expect(vo.value).toBe('owner');
    });

    it('should accept member role', () => {
      const vo = new MembershipRoleValueObject(MembershipRoleEnum.MEMBER);
      expect(vo.value).toBe('member');
    });
  });

  describe('invalid values', () => {
    it('should throw for an unknown role string', () => {
      expect(
        () => new MembershipRoleValueObject('admin' as MembershipRoleEnum),
      ).toThrow();
    });

    it('should throw for empty string', () => {
      expect(
        () => new MembershipRoleValueObject('' as MembershipRoleEnum),
      ).toThrow();
    });
  });

  describe('helpers', () => {
    it('isOwner should return true for owner role', () => {
      const vo = new MembershipRoleValueObject(MembershipRoleEnum.OWNER);
      expect(vo.isOwner()).toBe(true);
    });

    it('isOwner should return false for member role', () => {
      const vo = new MembershipRoleValueObject(MembershipRoleEnum.MEMBER);
      expect(vo.isOwner()).toBe(false);
    });
  });
});

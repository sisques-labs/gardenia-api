import { AppRoleValueObject } from './app-role.vo';

describe('AppRoleValueObject', () => {
  describe('valid values', () => {
    it('should accept "admin"', () => {
      expect(() => new AppRoleValueObject('admin')).not.toThrow();
    });

    it('should accept "user"', () => {
      expect(() => new AppRoleValueObject('user')).not.toThrow();
    });

    it('should expose the value', () => {
      const vo = new AppRoleValueObject('admin');
      expect(vo.value).toBe('admin');
    });
  });

  describe('invalid values', () => {
    it('should throw for an unsupported role string', () => {
      expect(() => new AppRoleValueObject('superadmin')).toThrow();
    });

    it('should throw for empty string', () => {
      expect(() => new AppRoleValueObject('')).toThrow();
    });
  });

  describe('isAdmin()', () => {
    it('should return true when role is admin', () => {
      const vo = new AppRoleValueObject('admin');
      expect(vo.isAdmin()).toBe(true);
    });

    it('should return false when role is user', () => {
      const vo = new AppRoleValueObject('user');
      expect(vo.isAdmin()).toBe(false);
    });
  });
});

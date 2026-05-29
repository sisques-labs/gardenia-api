import { SpaceNameValueObject } from './space-name.value-object';

describe('SpaceNameValueObject', () => {
  describe('valid values', () => {
    it('should accept a non-empty name', () => {
      const vo = new SpaceNameValueObject('My Space');
      expect(vo.value).toBe('My Space');
    });

    it('should accept a single character', () => {
      const vo = new SpaceNameValueObject('a');
      expect(vo.value).toBe('a');
    });

    it('should accept a name at max length (100 chars)', () => {
      const name = 'a'.repeat(100);
      const vo = new SpaceNameValueObject(name);
      expect(vo.value).toBe(name);
    });
  });

  describe('invalid values', () => {
    it('should throw when value is empty string', () => {
      expect(() => new SpaceNameValueObject('')).toThrow();
    });

    it('should throw when value exceeds max length (101 chars)', () => {
      const name = 'a'.repeat(101);
      expect(() => new SpaceNameValueObject(name)).toThrow();
    });
  });
});

import { SpaceNameVO } from './space-name.vo';

describe('SpaceNameVO', () => {
  describe('valid values', () => {
    it('should accept a single character (boundary: 1 char)', () => {
      const vo = new SpaceNameVO('a');
      expect(vo.value).toBe('a');
    });

    it('should accept a name at max length (boundary: 100 chars)', () => {
      const name = 'a'.repeat(100);
      const vo = new SpaceNameVO(name);
      expect(vo.value).toBe(name);
    });

    it('should accept a normal name', () => {
      const vo = new SpaceNameVO('My Space');
      expect(vo.value).toBe('My Space');
    });
  });

  describe('invalid values', () => {
    it('should throw when value is empty string', () => {
      expect(() => new SpaceNameVO('')).toThrow();
    });

    it('should throw when value is only whitespace', () => {
      expect(() => new SpaceNameVO('   ')).toThrow();
    });

    it('should throw when value exceeds max length (boundary: 101 chars)', () => {
      const name = 'a'.repeat(101);
      expect(() => new SpaceNameVO(name)).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for same value', () => {
      const vo1 = new SpaceNameVO('My Space');
      const vo2 = new SpaceNameVO('My Space');
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false for different values', () => {
      const vo1 = new SpaceNameVO('Space A');
      const vo2 = new SpaceNameVO('Space B');
      expect(vo1.equals(vo2)).toBe(false);
    });
  });
});

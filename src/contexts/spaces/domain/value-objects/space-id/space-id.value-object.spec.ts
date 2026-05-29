import { SpaceIdValueObject } from './space-id.value-object';

describe('SpaceIdValueObject', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

  describe('valid UUID', () => {
    it('should accept a valid UUID', () => {
      const vo = new SpaceIdValueObject(VALID_UUID);
      expect(vo.value).toBe(VALID_UUID);
    });

    it('should expose value via getter', () => {
      const vo = new SpaceIdValueObject(VALID_UUID);
      expect(vo.value).toBe(VALID_UUID);
    });

    it('should support equals comparison', () => {
      const vo1 = new SpaceIdValueObject(VALID_UUID);
      const vo2 = new SpaceIdValueObject(VALID_UUID);
      expect(vo1.equals(vo2)).toBe(true);
    });
  });

  describe('invalid UUID', () => {
    it('should throw when value is not a UUID', () => {
      expect(() => new SpaceIdValueObject('not-a-uuid')).toThrow();
    });

    it('should throw when value is empty string', () => {
      expect(() => new SpaceIdValueObject('')).toThrow();
    });

    it('should throw when value is a random string', () => {
      expect(() => new SpaceIdValueObject('abc123')).toThrow();
    });
  });
});

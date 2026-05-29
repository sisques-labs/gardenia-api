import { SpaceIdVO } from './space-id.vo';

describe('SpaceIdVO', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

  describe('create', () => {
    it('should accept a valid UUID', () => {
      const vo = new SpaceIdVO(VALID_UUID);
      expect(vo.value).toBe(VALID_UUID);
    });

    it('should throw when value is empty string', () => {
      expect(() => new SpaceIdVO('')).toThrow();
    });

    it('should throw when value is not a UUID', () => {
      expect(() => new SpaceIdVO('not-a-uuid')).toThrow();
    });

    it('should throw when value is a random string', () => {
      expect(() => new SpaceIdVO('abc123')).toThrow();
    });

    it('should expose value via getter', () => {
      const vo = new SpaceIdVO(VALID_UUID);
      expect(vo.value).toBe(VALID_UUID);
    });

    it('should support equals comparison', () => {
      const vo1 = new SpaceIdVO(VALID_UUID);
      const vo2 = new SpaceIdVO(VALID_UUID);
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should generate a new UUID when no value is provided', () => {
      const vo = new SpaceIdVO();
      expect(vo.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });
});

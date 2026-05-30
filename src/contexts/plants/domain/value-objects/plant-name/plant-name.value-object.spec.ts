import { PlantNameValueObject } from './plant-name.value-object';

describe('PlantNameValueObject', () => {
  describe('valid values', () => {
    it('should construct with a valid string', () => {
      const vo = new PlantNameValueObject('Rose');
      expect(vo.value).toBe('Rose');
    });

    it('should accept a string at max length (100 chars)', () => {
      const value = 'A'.repeat(100);
      const vo = new PlantNameValueObject(value);
      expect(vo.value).toBe(value);
    });
  });

  describe('invalid values', () => {
    it('should throw when value is empty string', () => {
      expect(() => new PlantNameValueObject('')).toThrow();
    });

    it('should throw when value exceeds 100 characters', () => {
      const value = 'A'.repeat(101);
      expect(() => new PlantNameValueObject(value)).toThrow();
    });
  });
});

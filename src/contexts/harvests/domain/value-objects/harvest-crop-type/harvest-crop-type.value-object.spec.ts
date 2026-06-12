import { HarvestCropTypeValueObject } from './harvest-crop-type.value-object';

describe('HarvestCropTypeValueObject', () => {
  it('accepts a non-empty string', () => {
    expect(() => new HarvestCropTypeValueObject('Tomate Cherry')).not.toThrow();
  });

  it('trims surrounding whitespace', () => {
    const vo = new HarvestCropTypeValueObject('  Albahaca  ');
    expect(vo.value).toBe('Albahaca');
  });

  it('throws for empty string', () => {
    expect(() => new HarvestCropTypeValueObject('')).toThrow();
  });

  it('throws for whitespace-only string', () => {
    expect(() => new HarvestCropTypeValueObject('   ')).toThrow();
  });

  it('throws when exceeding max length', () => {
    const tooLong = 'a'.repeat(201);
    expect(() => new HarvestCropTypeValueObject(tooLong)).toThrow();
  });
});

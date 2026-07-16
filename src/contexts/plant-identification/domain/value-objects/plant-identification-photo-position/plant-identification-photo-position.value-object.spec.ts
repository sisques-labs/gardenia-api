import { PlantIdentificationPhotoPositionValueObject } from './plant-identification-photo-position.value-object';

describe('PlantIdentificationPhotoPositionValueObject', () => {
  it('accepts a non-negative integer', () => {
    expect(new PlantIdentificationPhotoPositionValueObject(0).value).toBe(0);
  });

  it('throws for a negative value', () => {
    expect(() => new PlantIdentificationPhotoPositionValueObject(-1)).toThrow();
  });

  it('throws for a decimal value', () => {
    expect(
      () => new PlantIdentificationPhotoPositionValueObject(1.5),
    ).toThrow();
  });
});

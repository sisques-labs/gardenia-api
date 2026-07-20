import { PlantIdentificationPhotoUrlValueObject } from './plant-identification-photo-url.value-object';

describe('PlantIdentificationPhotoUrlValueObject', () => {
  it('accepts a URL', () => {
    expect(
      new PlantIdentificationPhotoUrlValueObject(
        'https://cdn.example.com/photo.jpg',
      ).value,
    ).toBe('https://cdn.example.com/photo.jpg');
  });

  it('throws for an empty value', () => {
    expect(() => new PlantIdentificationPhotoUrlValueObject('')).toThrow();
  });

  it('throws for a value over 1024 characters', () => {
    expect(
      () => new PlantIdentificationPhotoUrlValueObject('a'.repeat(1025)),
    ).toThrow();
  });
});

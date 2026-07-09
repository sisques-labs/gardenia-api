import { PlantPhotoUrlValueObject } from './plant-photo-url.value-object';

describe('PlantPhotoUrlValueObject', () => {
  it('accepts a valid url string', () => {
    const url = '/api/files/550e8400/content';
    expect(new PlantPhotoUrlValueObject(url).value).toBe(url);
  });

  it('throws for an empty string', () => {
    expect(() => new PlantPhotoUrlValueObject('')).toThrow();
  });

  it('throws when exceeding the max length', () => {
    const tooLong = 'a'.repeat(PlantPhotoUrlValueObject.MAX_LENGTH + 1);
    expect(() => new PlantPhotoUrlValueObject(tooLong)).toThrow();
  });
});

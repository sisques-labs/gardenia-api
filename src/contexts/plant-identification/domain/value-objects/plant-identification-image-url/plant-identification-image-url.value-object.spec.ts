import { PlantIdentificationImageUrlValueObject } from './plant-identification-image-url.value-object';

describe('PlantIdentificationImageUrlValueObject', () => {
  it('accepts a valid url', () => {
    expect(
      new PlantIdentificationImageUrlValueObject('/api/files/abc/content')
        .value,
    ).toBe('/api/files/abc/content');
  });

  it('throws for an empty url', () => {
    expect(() => new PlantIdentificationImageUrlValueObject('')).toThrow();
  });

  it('throws for a url over 500 characters', () => {
    expect(
      () => new PlantIdentificationImageUrlValueObject('a'.repeat(501)),
    ).toThrow();
  });

  it('accepts a url at exactly 500 characters', () => {
    expect(
      () => new PlantIdentificationImageUrlValueObject('a'.repeat(500)),
    ).not.toThrow();
  });
});

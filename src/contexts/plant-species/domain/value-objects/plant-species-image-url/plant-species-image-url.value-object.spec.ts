import { PlantSpeciesImageUrlValueObject } from './plant-species-image-url.value-object';

describe('PlantSpeciesImageUrlValueObject', () => {
  it('wraps a non-empty image URL', () => {
    const url = 'https://example.com/species.png';

    expect(new PlantSpeciesImageUrlValueObject(url).value).toBe(url);
  });

  it('throws for an empty string', () => {
    expect(() => new PlantSpeciesImageUrlValueObject('')).toThrow();
  });

  it('accepts a URL of exactly MAX_LENGTH chars', () => {
    const url = 'a'.repeat(PlantSpeciesImageUrlValueObject.MAX_LENGTH);

    expect(() => new PlantSpeciesImageUrlValueObject(url)).not.toThrow();
  });

  it('throws for a URL longer than MAX_LENGTH', () => {
    const url = 'a'.repeat(PlantSpeciesImageUrlValueObject.MAX_LENGTH + 1);

    expect(() => new PlantSpeciesImageUrlValueObject(url)).toThrow();
  });
});

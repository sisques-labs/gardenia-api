import { PlantImageUrlValueObject } from './plant-image-url.value-object';

describe('PlantImageUrlValueObject', () => {
  it('wraps a non-empty image URL', () => {
    const url = 'https://example.com/plant.png';

    expect(new PlantImageUrlValueObject(url).value).toBe(url);
  });

  it('throws for an empty string', () => {
    expect(() => new PlantImageUrlValueObject('')).toThrow();
  });

  it('accepts a URL of exactly MAX_LENGTH chars', () => {
    const url = 'a'.repeat(PlantImageUrlValueObject.MAX_LENGTH);

    expect(() => new PlantImageUrlValueObject(url)).not.toThrow();
  });

  it('throws for a URL longer than MAX_LENGTH', () => {
    const url = 'a'.repeat(PlantImageUrlValueObject.MAX_LENGTH + 1);

    expect(() => new PlantImageUrlValueObject(url)).toThrow();
  });
});

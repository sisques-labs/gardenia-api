import { PlantingSpotNameValueObject } from './planting-spot-name.value-object';

describe('PlantingSpotNameValueObject', () => {
  it('wraps a non-empty name', () => {
    expect(new PlantingSpotNameValueObject('Bed A').value).toBe('Bed A');
  });

  it('throws for an empty string', () => {
    expect(() => new PlantingSpotNameValueObject('')).toThrow();
  });

  it('accepts a name of exactly MAX_LENGTH chars', () => {
    const name = 'a'.repeat(PlantingSpotNameValueObject.MAX_LENGTH);

    expect(() => new PlantingSpotNameValueObject(name)).not.toThrow();
  });

  it('throws for a name longer than MAX_LENGTH', () => {
    const name = 'a'.repeat(PlantingSpotNameValueObject.MAX_LENGTH + 1);

    expect(() => new PlantingSpotNameValueObject(name)).toThrow();
  });
});

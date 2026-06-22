import { PlantingSpotSoilTypeValueObject } from './planting-spot-soil-type.value-object';

describe('PlantingSpotSoilTypeValueObject', () => {
  it('wraps a non-empty soil type', () => {
    expect(new PlantingSpotSoilTypeValueObject('Loamy').value).toBe('Loamy');
  });

  it('allows an empty string (soil type is optional)', () => {
    expect(() => new PlantingSpotSoilTypeValueObject('')).not.toThrow();
  });

  it('accepts a value of exactly MAX_LENGTH chars', () => {
    const soil = 'a'.repeat(PlantingSpotSoilTypeValueObject.MAX_LENGTH);

    expect(() => new PlantingSpotSoilTypeValueObject(soil)).not.toThrow();
  });

  it('throws for a value longer than MAX_LENGTH', () => {
    const soil = 'a'.repeat(PlantingSpotSoilTypeValueObject.MAX_LENGTH + 1);

    expect(() => new PlantingSpotSoilTypeValueObject(soil)).toThrow();
  });
});

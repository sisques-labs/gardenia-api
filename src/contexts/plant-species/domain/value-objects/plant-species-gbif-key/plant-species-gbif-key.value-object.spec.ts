import { PlantSpeciesGbifKeyValueObject } from './plant-species-gbif-key.value-object';

describe('PlantSpeciesGbifKeyValueObject', () => {
  it('accepts a positive integer', () => {
    expect(new PlantSpeciesGbifKeyValueObject(2882337).value).toBe(2882337);
  });

  it('accepts the minimum value of 1', () => {
    expect(() => new PlantSpeciesGbifKeyValueObject(1)).not.toThrow();
  });

  it('throws for zero', () => {
    expect(() => new PlantSpeciesGbifKeyValueObject(0)).toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantSpeciesGbifKeyValueObject(-1)).toThrow();
  });

  it('throws for a decimal value', () => {
    expect(() => new PlantSpeciesGbifKeyValueObject(2.5)).toThrow();
  });
});

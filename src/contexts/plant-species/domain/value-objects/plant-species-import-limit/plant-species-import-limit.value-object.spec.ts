import { PlantSpeciesImportLimitValueObject } from './plant-species-import-limit.value-object';

describe('PlantSpeciesImportLimitValueObject', () => {
  it('accepts a positive integer', () => {
    expect(new PlantSpeciesImportLimitValueObject(25).value).toBe(25);
  });

  it('accepts the minimum value of 1', () => {
    expect(() => new PlantSpeciesImportLimitValueObject(1)).not.toThrow();
  });

  it('throws for zero (below minimum)', () => {
    expect(() => new PlantSpeciesImportLimitValueObject(0)).toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantSpeciesImportLimitValueObject(-1)).toThrow();
  });

  it('throws for a decimal value', () => {
    expect(() => new PlantSpeciesImportLimitValueObject(2.5)).toThrow();
  });
});

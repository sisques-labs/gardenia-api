import { PlantSpeciesImportOffsetValueObject } from './plant-species-import-offset.value-object';

describe('PlantSpeciesImportOffsetValueObject', () => {
  it('accepts a positive integer', () => {
    expect(new PlantSpeciesImportOffsetValueObject(10).value).toBe(10);
  });

  it('accepts the minimum value of 0', () => {
    expect(() => new PlantSpeciesImportOffsetValueObject(0)).not.toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantSpeciesImportOffsetValueObject(-1)).toThrow();
  });

  it('throws for a decimal value', () => {
    expect(() => new PlantSpeciesImportOffsetValueObject(1.5)).toThrow();
  });
});

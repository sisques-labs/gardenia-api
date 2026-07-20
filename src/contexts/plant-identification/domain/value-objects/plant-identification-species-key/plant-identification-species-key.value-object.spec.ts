import { PlantIdentificationSpeciesKeyValueObject } from './plant-identification-species-key.value-object';

describe('PlantIdentificationSpeciesKeyValueObject', () => {
  it('accepts a positive integer', () => {
    expect(new PlantIdentificationSpeciesKeyValueObject(2882337).value).toBe(
      2882337,
    );
  });

  it('throws for zero', () => {
    expect(() => new PlantIdentificationSpeciesKeyValueObject(0)).toThrow();
  });

  it('throws for a negative key', () => {
    expect(() => new PlantIdentificationSpeciesKeyValueObject(-1)).toThrow();
  });

  it('throws for a non-integer key', () => {
    expect(() => new PlantIdentificationSpeciesKeyValueObject(1.5)).toThrow();
  });
});

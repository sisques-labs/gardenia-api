import { PlantIdentificationRankValueObject } from './plant-identification-rank.value-object';

describe('PlantIdentificationRankValueObject', () => {
  it('accepts a non-negative integer', () => {
    expect(new PlantIdentificationRankValueObject(0).value).toBe(0);
  });

  it('throws for a negative value', () => {
    expect(() => new PlantIdentificationRankValueObject(-1)).toThrow();
  });

  it('throws for a decimal value', () => {
    expect(() => new PlantIdentificationRankValueObject(1.5)).toThrow();
  });
});

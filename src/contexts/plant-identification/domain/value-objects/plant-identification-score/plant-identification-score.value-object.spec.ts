import { PlantIdentificationScoreValueObject } from './plant-identification-score.value-object';

describe('PlantIdentificationScoreValueObject', () => {
  it('accepts a score within 0-1', () => {
    expect(new PlantIdentificationScoreValueObject(0.2).value).toBe(0.2);
  });

  it('accepts the boundary values 0 and 1', () => {
    expect(new PlantIdentificationScoreValueObject(0).value).toBe(0);
    expect(new PlantIdentificationScoreValueObject(1).value).toBe(1);
  });

  it('throws for a negative score', () => {
    expect(() => new PlantIdentificationScoreValueObject(-0.1)).toThrow();
  });

  it('throws for a score above 1', () => {
    expect(() => new PlantIdentificationScoreValueObject(1.1)).toThrow();
  });
});

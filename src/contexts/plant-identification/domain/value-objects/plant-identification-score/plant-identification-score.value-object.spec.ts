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

  it('rounds a real-world, many-decimal PlantNet score instead of throwing', () => {
    expect(
      new PlantIdentificationScoreValueObject(0.85231933593749).value,
    ).toBe(0.8523);
  });

  it('rounds up at the midpoint', () => {
    expect(new PlantIdentificationScoreValueObject(0.123459).value).toBe(
      0.1235,
    );
  });

  describe('meetsThreshold', () => {
    it('returns true when the score is at or above the threshold', () => {
      expect(
        new PlantIdentificationScoreValueObject(0.2).meetsThreshold(0.2),
      ).toBe(true);
      expect(
        new PlantIdentificationScoreValueObject(0.5).meetsThreshold(0.2),
      ).toBe(true);
    });

    it('returns false when the score is below the threshold', () => {
      expect(
        new PlantIdentificationScoreValueObject(0.05).meetsThreshold(0.2),
      ).toBe(false);
    });
  });
});

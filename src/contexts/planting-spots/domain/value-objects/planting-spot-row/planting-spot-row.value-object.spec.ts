import { PlantingSpotRowValueObject } from './planting-spot-row.value-object';

describe('PlantingSpotRowValueObject', () => {
  it('accepts a positive row index', () => {
    expect(new PlantingSpotRowValueObject(3).value).toBe(3);
  });

  it('accepts the minimum value of 1', () => {
    expect(() => new PlantingSpotRowValueObject(1)).not.toThrow();
  });

  it('throws for zero (below minimum)', () => {
    expect(() => new PlantingSpotRowValueObject(0)).toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantingSpotRowValueObject(-2)).toThrow();
  });
});

import { PlantingSpotCapacityValueObject } from './planting-spot-capacity.value-object';

describe('PlantingSpotCapacityValueObject', () => {
  it('accepts a positive capacity', () => {
    expect(new PlantingSpotCapacityValueObject(12).value).toBe(12);
  });

  it('accepts the minimum value of 1', () => {
    expect(() => new PlantingSpotCapacityValueObject(1)).not.toThrow();
  });

  it('throws for zero (below minimum)', () => {
    expect(() => new PlantingSpotCapacityValueObject(0)).toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantingSpotCapacityValueObject(-3)).toThrow();
  });
});

import { PlantingSpotColumnValueObject } from './planting-spot-column.value-object';

describe('PlantingSpotColumnValueObject', () => {
  it('accepts a positive column index', () => {
    expect(new PlantingSpotColumnValueObject(4).value).toBe(4);
  });

  it('accepts the minimum value of 1', () => {
    expect(() => new PlantingSpotColumnValueObject(1)).not.toThrow();
  });

  it('throws for zero (below minimum)', () => {
    expect(() => new PlantingSpotColumnValueObject(0)).toThrow();
  });

  it('throws for a negative value', () => {
    expect(() => new PlantingSpotColumnValueObject(-1)).toThrow();
  });
});

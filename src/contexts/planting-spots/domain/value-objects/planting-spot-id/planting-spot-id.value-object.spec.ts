import { PlantingSpotIdValueObject } from './planting-spot-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantingSpotIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PlantingSpotIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PlantingSpotIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PlantingSpotIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PlantingSpotIdValueObject(VALID_UUID);
    const b = new PlantingSpotIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

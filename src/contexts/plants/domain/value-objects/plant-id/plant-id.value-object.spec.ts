import { PlantIdValueObject } from './plant-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PlantIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PlantIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PlantIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PlantIdValueObject(VALID_UUID);
    const b = new PlantIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

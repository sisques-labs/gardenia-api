import { PlantSpeciesIdValueObject } from './plant-species-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantSpeciesIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PlantSpeciesIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PlantSpeciesIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PlantSpeciesIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PlantSpeciesIdValueObject(VALID_UUID);
    const b = new PlantSpeciesIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

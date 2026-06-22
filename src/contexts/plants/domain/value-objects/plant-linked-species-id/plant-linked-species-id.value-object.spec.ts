import { PlantLinkedSpeciesIdValueObject } from './plant-linked-species-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantLinkedSpeciesIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PlantLinkedSpeciesIdValueObject(VALID_UUID).value).toBe(
      VALID_UUID,
    );
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PlantLinkedSpeciesIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PlantLinkedSpeciesIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PlantLinkedSpeciesIdValueObject(VALID_UUID);
    const b = new PlantLinkedSpeciesIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

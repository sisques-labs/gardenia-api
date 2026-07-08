import { PlantPhotoIdValueObject } from './plant-photo-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantPhotoIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PlantPhotoIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PlantPhotoIdValueObject('abc123')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PlantPhotoIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PlantPhotoIdValueObject(VALID_UUID);
    const b = new PlantPhotoIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

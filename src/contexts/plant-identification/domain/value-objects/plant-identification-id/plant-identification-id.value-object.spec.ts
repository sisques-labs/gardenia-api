import { PlantIdentificationIdValueObject } from './plant-identification-id.value-object';

describe('PlantIdentificationIdValueObject', () => {
  it('accepts a valid uuid', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(new PlantIdentificationIdValueObject(id).value).toBe(id);
  });

  it('throws for an invalid uuid', () => {
    expect(() => new PlantIdentificationIdValueObject('not-a-uuid')).toThrow();
  });
});

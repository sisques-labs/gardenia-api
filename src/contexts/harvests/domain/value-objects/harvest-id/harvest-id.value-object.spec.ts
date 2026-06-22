import { HarvestIdValueObject } from './harvest-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('HarvestIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new HarvestIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new HarvestIdValueObject('abc123')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new HarvestIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new HarvestIdValueObject(VALID_UUID);
    const b = new HarvestIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

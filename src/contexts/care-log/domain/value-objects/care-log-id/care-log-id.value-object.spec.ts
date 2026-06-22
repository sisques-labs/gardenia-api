import { CareLogIdValueObject } from './care-log-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('CareLogIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new CareLogIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new CareLogIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new CareLogIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new CareLogIdValueObject(VALID_UUID);
    const b = new CareLogIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

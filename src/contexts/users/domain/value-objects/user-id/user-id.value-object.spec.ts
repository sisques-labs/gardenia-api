import { UserIdValueObject } from './user-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('UserIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new UserIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new UserIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new UserIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new UserIdValueObject(VALID_UUID);
    const b = new UserIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

import { QrIdValueObject } from './qr-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('QrIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new QrIdValueObject(VALID_UUID).value).toBe(VALID_UUID);
  });

  it('throws for an invalid UUID', () => {
    expect(() => new QrIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new QrIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new QrIdValueObject(VALID_UUID);
    const b = new QrIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

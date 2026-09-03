import { PushSubscriptionIdValueObject } from './push-subscription-id.value-object';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('PushSubscriptionIdValueObject', () => {
  it('accepts a valid UUID', () => {
    expect(new PushSubscriptionIdValueObject(VALID_UUID).value).toBe(
      VALID_UUID,
    );
  });

  it('throws for an invalid UUID', () => {
    expect(() => new PushSubscriptionIdValueObject('not-a-uuid')).toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushSubscriptionIdValueObject('')).toThrow();
  });

  it('supports equality comparison', () => {
    const a = new PushSubscriptionIdValueObject(VALID_UUID);
    const b = new PushSubscriptionIdValueObject(VALID_UUID);

    expect(a.equals(b)).toBe(true);
  });
});

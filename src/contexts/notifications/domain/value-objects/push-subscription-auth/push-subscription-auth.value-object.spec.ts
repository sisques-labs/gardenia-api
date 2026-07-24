import { PushSubscriptionAuthValueObject } from './push-subscription-auth.value-object';

describe('PushSubscriptionAuthValueObject', () => {
  it('accepts a non-empty secret', () => {
    expect(
      () => new PushSubscriptionAuthValueObject('auth-secret'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushSubscriptionAuthValueObject('')).toThrow();
  });

  it('throws for whitespace only', () => {
    expect(() => new PushSubscriptionAuthValueObject('   ')).toThrow();
  });
});

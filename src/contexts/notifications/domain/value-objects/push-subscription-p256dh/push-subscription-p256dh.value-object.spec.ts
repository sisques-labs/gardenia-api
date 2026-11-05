import { PushSubscriptionP256dhValueObject } from './push-subscription-p256dh.value-object';

describe('PushSubscriptionP256dhValueObject', () => {
  it('accepts a non-empty key', () => {
    expect(
      () => new PushSubscriptionP256dhValueObject('BNc...key'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushSubscriptionP256dhValueObject('')).toThrow();
  });

  it('throws for whitespace only', () => {
    expect(() => new PushSubscriptionP256dhValueObject('   ')).toThrow();
  });
});

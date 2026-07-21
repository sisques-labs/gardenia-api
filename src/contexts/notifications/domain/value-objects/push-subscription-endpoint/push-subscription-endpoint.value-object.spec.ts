import { PushSubscriptionEndpointValueObject } from './push-subscription-endpoint.value-object';

describe('PushSubscriptionEndpointValueObject', () => {
  it('accepts a non-empty endpoint URL', () => {
    expect(
      () =>
        new PushSubscriptionEndpointValueObject(
          'https://fcm.googleapis.com/fcm/send/abc123',
        ),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushSubscriptionEndpointValueObject('')).toThrow();
  });

  it('throws for whitespace only', () => {
    expect(() => new PushSubscriptionEndpointValueObject('   ')).toThrow();
  });

  it('throws when exceeding the max length', () => {
    const tooLong = 'https://example.com/'.padEnd(2001, 'a');
    expect(() => new PushSubscriptionEndpointValueObject(tooLong)).toThrow();
  });
});

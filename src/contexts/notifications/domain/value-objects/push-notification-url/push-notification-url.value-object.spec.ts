import { PushNotificationUrlValueObject } from './push-notification-url.value-object';

describe('PushNotificationUrlValueObject', () => {
  it('accepts a relative path', () => {
    expect(
      () => new PushNotificationUrlValueObject('/plants/abc123'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushNotificationUrlValueObject('')).toThrow();
  });
});

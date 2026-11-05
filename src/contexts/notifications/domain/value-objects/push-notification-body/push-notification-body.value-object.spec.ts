import { PushNotificationBodyValueObject } from './push-notification-body.value-object';

describe('PushNotificationBodyValueObject', () => {
  it('accepts a non-empty body', () => {
    expect(
      () => new PushNotificationBodyValueObject('watering is due'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushNotificationBodyValueObject('')).toThrow();
  });
});

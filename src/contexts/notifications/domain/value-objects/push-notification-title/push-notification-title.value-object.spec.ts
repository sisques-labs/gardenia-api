import { PushNotificationTitleValueObject } from './push-notification-title.value-object';

describe('PushNotificationTitleValueObject', () => {
  it('accepts a non-empty title', () => {
    expect(
      () => new PushNotificationTitleValueObject('Time to water your plant'),
    ).not.toThrow();
  });

  it('throws for an empty string', () => {
    expect(() => new PushNotificationTitleValueObject('')).toThrow();
  });
});

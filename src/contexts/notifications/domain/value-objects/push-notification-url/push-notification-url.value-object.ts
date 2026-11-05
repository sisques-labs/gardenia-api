import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * A deep-link target, e.g. `/plants/{id}`. Deliberately not `UrlValueObject`
 * from the kit — that requires an absolute URL, but this is a relative
 * in-app path.
 */
export class PushNotificationUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: PushNotificationUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

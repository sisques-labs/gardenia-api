import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PushNotificationBodyValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 500;

  constructor(value: string) {
    super(value, {
      maxLength: PushNotificationBodyValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

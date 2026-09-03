import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PushNotificationTitleValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 200;

  constructor(value: string) {
    super(value, {
      maxLength: PushNotificationTitleValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

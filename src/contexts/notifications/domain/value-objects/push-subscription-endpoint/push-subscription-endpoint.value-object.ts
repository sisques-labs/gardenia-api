import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PushSubscriptionEndpointValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 2000;

  constructor(value: string) {
    super(value, {
      maxLength: PushSubscriptionEndpointValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

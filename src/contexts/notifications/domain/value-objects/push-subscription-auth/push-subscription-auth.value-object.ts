import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PushSubscriptionAuthValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }
}

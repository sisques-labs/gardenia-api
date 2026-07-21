import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class PushSubscriptionP256dhValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }
}

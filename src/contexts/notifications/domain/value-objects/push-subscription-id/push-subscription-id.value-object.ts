import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class PushSubscriptionIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}

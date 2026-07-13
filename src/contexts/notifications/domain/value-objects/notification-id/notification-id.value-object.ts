import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class NotificationIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}

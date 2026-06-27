import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}

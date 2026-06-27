import { BooleanValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleActiveValueObject extends BooleanValueObject {
  constructor(value: boolean) {
    super(value);
  }
}

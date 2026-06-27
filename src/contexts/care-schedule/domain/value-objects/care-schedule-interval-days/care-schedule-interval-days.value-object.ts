import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleIntervalDaysValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}

import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class CareScheduleQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0.001 });
  }
}

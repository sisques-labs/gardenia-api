import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskPriorityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1, max: 10, allowDecimals: false });
  }
}

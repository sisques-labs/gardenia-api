import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskTimeoutValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1, allowDecimals: false });
  }
}

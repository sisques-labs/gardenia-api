import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskRetryCountValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, max: 10, allowDecimals: false });
  }
}

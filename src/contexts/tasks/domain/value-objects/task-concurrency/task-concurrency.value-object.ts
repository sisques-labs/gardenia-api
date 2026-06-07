import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskConcurrencyValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1, max: 100, allowDecimals: false });
  }
}

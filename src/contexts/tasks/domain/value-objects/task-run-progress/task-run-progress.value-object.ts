import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskRunProgressValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, max: 100, allowDecimals: false });
  }
}

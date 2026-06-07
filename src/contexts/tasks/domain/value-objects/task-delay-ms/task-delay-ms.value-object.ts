import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class TaskDelayMsValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 0, allowDecimals: false });
  }
}

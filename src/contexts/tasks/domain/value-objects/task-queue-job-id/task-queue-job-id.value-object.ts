import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskQueueJobIdValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: false });
  }
}

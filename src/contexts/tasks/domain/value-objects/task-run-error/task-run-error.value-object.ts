import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskRunErrorValueObject extends StringValueObject {
  constructor(value: string) {
    super(value, { allowEmpty: true });
  }
}

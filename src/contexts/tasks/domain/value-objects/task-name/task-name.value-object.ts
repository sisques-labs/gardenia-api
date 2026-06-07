import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 255;

  constructor(value: string) {
    super(value, { maxLength: TaskNameValueObject.MAX_LENGTH, allowEmpty: false });
  }
}

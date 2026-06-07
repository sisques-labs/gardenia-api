import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskTargetTypeValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: TaskTargetTypeValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

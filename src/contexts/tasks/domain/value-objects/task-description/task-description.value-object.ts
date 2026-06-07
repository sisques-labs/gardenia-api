import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskDescriptionValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 1000;

  constructor(value: string) {
    super(value, {
      maxLength: TaskDescriptionValueObject.MAX_LENGTH,
      allowEmpty: true,
    });
  }
}

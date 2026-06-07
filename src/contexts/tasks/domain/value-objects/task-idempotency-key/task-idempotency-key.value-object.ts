import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskIdempotencyKeyValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 255;

  constructor(value: string) {
    super(value, {
      maxLength: TaskIdempotencyKeyValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

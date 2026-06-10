import { StringValueObject } from '@sisques-labs/nestjs-kit';

export class TaskHandlerKeyValueObject extends StringValueObject {
  static readonly PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  constructor(value: string) {
    super(value, {
      allowEmpty: false,
      pattern: TaskHandlerKeyValueObject.PATTERN,
    });
  }

  static fromNullable(value: string | null): TaskHandlerKeyValueObject | null {
    if (value === null) return null;
    return new TaskHandlerKeyValueObject(value);
  }
}

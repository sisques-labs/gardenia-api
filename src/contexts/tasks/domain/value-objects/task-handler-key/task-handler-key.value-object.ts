import { BaseException, FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

export class InvalidTaskHandlerKeyException extends BaseException {
  constructor(value: string) {
    super(
      `Task handler key '${value}' is invalid. Must be lowercase letters, numbers and hyphens only.`,
    );
  }
}

export class TaskHandlerKeyValueObject {
  private readonly _value: string;
  static readonly PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  constructor(value: string) {
    if (!value?.trim()) throw new FieldIsRequiredException('handlerKey');
    if (!TaskHandlerKeyValueObject.PATTERN.test(value.trim())) {
      throw new InvalidTaskHandlerKeyException(value);
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }
}

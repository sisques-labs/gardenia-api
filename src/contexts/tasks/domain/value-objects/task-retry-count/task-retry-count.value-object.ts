import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidTaskRetryCountException extends BaseException {
  constructor(value: number) {
    super(`Task retry count must be between 0 and 10, got ${value}`);
  }
}

export class TaskRetryCountValueObject {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 0 || value > 10 || !Number.isInteger(value)) {
      throw new InvalidTaskRetryCountException(value);
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}

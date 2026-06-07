import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidTaskTimeoutException extends BaseException {
  constructor(value: number) {
    super(`Task timeout must be greater than 0 ms, got ${value}`);
  }
}

export class TaskTimeoutValueObject {
  private readonly _value: number;

  constructor(value: number) {
    if (value <= 0 || !Number.isInteger(value)) {
      throw new InvalidTaskTimeoutException(value);
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}

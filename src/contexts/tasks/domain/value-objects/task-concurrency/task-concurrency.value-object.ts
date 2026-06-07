import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidTaskConcurrencyException extends BaseException {
  constructor(value: number) {
    super(`Task concurrency must be between 1 and 100, got ${value}`);
  }
}

export class TaskConcurrencyValueObject {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 1 || value > 100 || !Number.isInteger(value)) {
      throw new InvalidTaskConcurrencyException(value);
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}

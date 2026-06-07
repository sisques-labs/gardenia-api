import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidTaskPriorityException extends BaseException {
  constructor(value: number) {
    super(`Task priority must be between 1 and 10, got ${value}`);
  }
}

export class TaskPriorityValueObject {
  private readonly _value: number;

  constructor(value: number) {
    if (value < 1 || value > 10 || !Number.isInteger(value)) {
      throw new InvalidTaskPriorityException(value);
    }
    this._value = value;
  }

  get value(): number {
    return this._value;
  }
}

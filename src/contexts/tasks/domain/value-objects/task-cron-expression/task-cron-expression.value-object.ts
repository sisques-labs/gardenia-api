import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidCronExpressionException extends BaseException {
  constructor(value: string) {
    super(`Cron expression '${value}' is not a valid 5-field cron pattern`);
  }
}

export class TaskCronExpressionValueObject {
  private readonly _value: string;

  // 5-field cron: minute hour dom month dow
  static readonly PATTERN =
    /^(\*|([0-9]|[1-5][0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2]))\s+(\*|[0-6])$/;

  constructor(value: string) {
    const trimmed = value?.trim();
    if (!trimmed || !TaskCronExpressionValueObject.PATTERN.test(trimmed)) {
      throw new InvalidCronExpressionException(value ?? '');
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }
}

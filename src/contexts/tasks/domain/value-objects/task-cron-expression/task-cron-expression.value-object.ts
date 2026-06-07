import { StringValueObject } from '@sisques-labs/nestjs-kit';

import { InvalidCronExpressionException } from '@contexts/tasks/domain/exceptions/invalid-cron-expression.exception';

export class TaskCronExpressionValueObject extends StringValueObject {
  static readonly PATTERN =
    /^(\*|([0-9]|[1-5][0-9]))\s+(\*|([0-9]|1[0-9]|2[0-3]))\s+(\*|([1-9]|[12][0-9]|3[01]))\s+(\*|([1-9]|1[0-2]))\s+(\*|[0-6])$/;

  constructor(value: string) {
    const trimmed = value?.trim();
    if (!trimmed || !TaskCronExpressionValueObject.PATTERN.test(trimmed)) {
      throw new InvalidCronExpressionException(value ?? '');
    }
    super(trimmed, { allowEmpty: false });
  }
}

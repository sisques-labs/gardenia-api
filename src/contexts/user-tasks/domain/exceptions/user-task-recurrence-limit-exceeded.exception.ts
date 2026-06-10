import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserTaskRecurrenceLimitExceededException extends BaseException {
  constructor(count: number, max: number) {
    super(
      `Recurrence would generate ${count} instances, exceeding the maximum of ${max}`,
    );
  }
}

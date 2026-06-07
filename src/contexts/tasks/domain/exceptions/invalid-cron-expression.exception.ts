import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidCronExpressionException extends BaseException {
  constructor(value: string) {
    super(`Cron expression '${value}' is not a valid 5-field cron pattern`);
  }
}

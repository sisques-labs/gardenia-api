import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserTaskNotCompletableException extends BaseException {
  constructor(scheduledDate: Date) {
    super(
      `UserTask scheduled for ${scheduledDate.toISOString()} cannot be completed before its scheduled date`,
    );
  }
}

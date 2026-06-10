import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserTaskNotReschedulableException extends BaseException {
  constructor(status: string) {
    super(`UserTask in status '${status}' cannot be rescheduled`);
  }
}

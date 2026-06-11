import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskNotReschedulableException extends BaseException {
  constructor(reason: string) {
    super(`Task cannot be rescheduled: ${reason}`);
  }
}

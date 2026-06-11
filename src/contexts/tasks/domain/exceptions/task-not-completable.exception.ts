import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskNotCompletableException extends BaseException {
  constructor(reason: string) {
    super(`Task cannot be completed: ${reason}`);
  }
}

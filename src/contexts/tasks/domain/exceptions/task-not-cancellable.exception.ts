import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskNotCancellableException extends BaseException {
  constructor(currentStatus: string) {
    super(
      `Task cannot be cancelled because its current status is '${currentStatus}'. Only pending tasks can be cancelled.`,
    );
  }
}

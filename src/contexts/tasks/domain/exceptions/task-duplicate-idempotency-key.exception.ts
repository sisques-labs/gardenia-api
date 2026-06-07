import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskDuplicateIdempotencyKeyException extends BaseException {
  constructor(
    public readonly existingTaskId: string,
    key: string,
  ) {
    super(
      `A task with idempotency key '${key}' already exists (id: ${existingTaskId})`,
    );
  }
}

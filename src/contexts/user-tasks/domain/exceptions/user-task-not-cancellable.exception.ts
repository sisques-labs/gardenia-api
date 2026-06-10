import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserTaskNotCancellableException extends BaseException {
  constructor(status: string) {
    super(`UserTask in status '${status}' cannot be cancelled`);
  }
}

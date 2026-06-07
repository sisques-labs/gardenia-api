import { BaseException } from '@sisques-labs/nestjs-kit';

export class TaskNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Task with id '${id}' was not found`);
  }
}

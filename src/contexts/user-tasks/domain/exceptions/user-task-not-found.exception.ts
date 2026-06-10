import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserTaskNotFoundException extends BaseException {
  constructor(id: string) {
    super(`UserTask with id '${id}' was not found`);
  }
}

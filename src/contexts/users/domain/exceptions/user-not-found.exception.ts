import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserNotFoundException extends BaseException {
  constructor(id: string) {
    super(`User with id '${id}' was not found`);
  }
}

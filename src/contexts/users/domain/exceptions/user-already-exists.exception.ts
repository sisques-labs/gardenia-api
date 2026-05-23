import { BaseException } from '@sisques-labs/nestjs-kit';

export class UserAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`);
  }
}

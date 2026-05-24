import { BaseException } from '@sisques-labs/nestjs-kit';

export class AccountAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super(`Account with email '${email}' already exists`);
  }
}

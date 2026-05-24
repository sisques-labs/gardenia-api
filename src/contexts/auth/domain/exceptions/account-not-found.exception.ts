import { BaseException } from '@sisques-labs/nestjs-kit';

export class AccountNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Account with id '${id}' was not found`);
  }
}

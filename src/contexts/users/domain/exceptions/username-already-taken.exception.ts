import { BaseException } from '@sisques-labs/nestjs-kit';

export class UsernameAlreadyTakenException extends BaseException {
  constructor(username: string) {
    super(`Username '${username}' is already taken.`);
  }
}

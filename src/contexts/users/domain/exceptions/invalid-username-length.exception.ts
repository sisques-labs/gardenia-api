import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidUsernameLengthException extends BaseException {
  constructor(username: string) {
    super(
      `Username '${username}' has invalid length. Must be between 3 and 30 characters.`,
    );
  }
}

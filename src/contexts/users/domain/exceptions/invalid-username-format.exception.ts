import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidUsernameFormatException extends BaseException {
  constructor(username: string) {
    super(
      `Username '${username}' has invalid format. Only lowercase letters, digits, and underscores are allowed (a-z0-9_).`,
    );
  }
}

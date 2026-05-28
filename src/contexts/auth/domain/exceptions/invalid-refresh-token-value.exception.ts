import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidRefreshTokenValueException extends BaseException {
  constructor() {
    super('Refresh token is required');
  }
}

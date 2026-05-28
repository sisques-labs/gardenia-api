import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidRefreshTokenException extends BaseException {
  constructor() {
    super('Invalid refresh token');
  }
}

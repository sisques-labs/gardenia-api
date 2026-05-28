import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidRefreshTokenHashException extends BaseException {
  constructor() {
    super(
      'RefreshTokenHash must be exactly 64 lowercase hex characters (SHA-256)',
    );
  }
}

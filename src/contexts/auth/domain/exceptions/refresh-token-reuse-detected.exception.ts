import { BaseException } from '@sisques-labs/nestjs-kit';

export class RefreshTokenReuseDetectedException extends BaseException {
  constructor() {
    super('Refresh token reuse detected; all sessions revoked');
  }
}

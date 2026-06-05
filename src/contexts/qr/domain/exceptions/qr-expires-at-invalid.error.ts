import { BaseException } from '@sisques-labs/nestjs-kit';

export class QrExpiresAtInvalidError extends BaseException {
  constructor() {
    super('expiresAt must be a future date');
  }
}

import { Injectable } from '@nestjs/common';

import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';

@Injectable()
export class QrExpiresAtDomainService {
  assertIsFuture(expiresAt: Date | null): void {
    if (expiresAt !== null && expiresAt <= new Date()) {
      throw new QrExpiresAtInvalidError();
    }
  }

  assertNotExpired(id: string, expiresAt: Date | null): void {
    if (expiresAt !== null && expiresAt < new Date()) {
      throw new QrExpiredError(id);
    }
  }
}

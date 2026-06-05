import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';

@Injectable()
export class AssertQrExpiresAtIsFutureDomainService implements IBaseService<
  Date | null,
  void
> {
  async execute(expiresAt: Date | null): Promise<void> {
    if (expiresAt !== null && expiresAt <= new Date()) {
      throw new QrExpiresAtInvalidError();
    }
  }
}

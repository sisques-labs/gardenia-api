import { Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';

export interface AssertQrNotExpiredInput {
  id: string;
  expiresAt: Date | null;
}

@Injectable()
export class AssertQrNotExpiredDomainService implements IBaseService<
  AssertQrNotExpiredInput,
  void
> {
  async execute({ id, expiresAt }: AssertQrNotExpiredInput): Promise<void> {
    if (expiresAt !== null && expiresAt < new Date()) {
      throw new QrExpiredError(id);
    }
  }
}

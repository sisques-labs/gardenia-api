import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrExpiresAtValueObject } from '@contexts/qr/domain/value-objects/qr-expires-at/qr-expires-at.value-object';
import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export interface CreateQrCommandInput {
  targetUrl: string;
  spaceId: string;
  expiresAt?: Date;
}

export class CreateQrCommand {
  public readonly targetUrl: QrTargetUrlValueObject;
  public readonly spaceId: UuidValueObject;
  public readonly expiresAt: QrExpiresAtValueObject | null;

  constructor(input: CreateQrCommandInput) {
    this.targetUrl = new QrTargetUrlValueObject(input.targetUrl);
    this.spaceId = new UuidValueObject(input.spaceId);
    if (input.expiresAt !== undefined && input.expiresAt <= new Date()) {
      throw new Error('expiresAt must be a future date');
    }
    this.expiresAt = input.expiresAt
      ? new QrExpiresAtValueObject(input.expiresAt)
      : null;
  }
}

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { QrTargetUrlValueObject } from '@contexts/qr/domain/value-objects/qr-target-url/qr-target-url.value-object';

export interface CreateQrCommandInput {
  targetUrl: string;
  spaceId: string;
}

export class CreateQrCommand {
  public readonly targetUrl: QrTargetUrlValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreateQrCommandInput) {
    this.targetUrl = new QrTargetUrlValueObject(input.targetUrl);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

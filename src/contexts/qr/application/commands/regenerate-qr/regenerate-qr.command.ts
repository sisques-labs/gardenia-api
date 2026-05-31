import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';

export interface RegenerateQrCommandInput {
  qrId: string;
}

export class RegenerateQrCommand {
  public readonly qrId: QrIdValueObject;

  constructor(input: RegenerateQrCommandInput) {
    this.qrId = new QrIdValueObject(input.qrId);
  }
}

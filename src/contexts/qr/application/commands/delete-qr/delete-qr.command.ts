import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';

export interface DeleteQrCommandInput {
  qrId: string;
}

export class DeleteQrCommand {
  public readonly qrId: QrIdValueObject;

  constructor(input: DeleteQrCommandInput) {
    this.qrId = new QrIdValueObject(input.qrId);
  }
}

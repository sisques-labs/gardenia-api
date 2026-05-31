import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';

export interface QrFindPngByIdQueryInput {
  qrId: string;
}

export class QrFindPngByIdQuery {
  public readonly qrId: QrIdValueObject;

  constructor(input: QrFindPngByIdQueryInput) {
    this.qrId = new QrIdValueObject(input.qrId);
  }
}

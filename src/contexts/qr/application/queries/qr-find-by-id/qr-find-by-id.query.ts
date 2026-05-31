import { QrIdValueObject } from '@contexts/qr/domain/value-objects/qr-id/qr-id.value-object';

export interface QrFindByIdQueryInput {
  qrId: string;
}

export class QrFindByIdQuery {
  public readonly qrId: QrIdValueObject;

  constructor(input: QrFindByIdQueryInput) {
    this.qrId = new QrIdValueObject(input.qrId);
  }
}

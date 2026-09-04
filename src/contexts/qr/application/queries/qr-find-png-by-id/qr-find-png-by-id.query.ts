import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface QrFindPngByIdQueryInput {
  qrId: string;
}

export class QrFindPngByIdQuery {
  public readonly qrId: UuidValueObject;

  constructor(input: QrFindPngByIdQueryInput) {
    this.qrId = new UuidValueObject(input.qrId);
  }
}

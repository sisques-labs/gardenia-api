import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface QrFindByIdQueryInput {
  qrId: string;
}

export class QrFindByIdQuery {
  public readonly qrId: UuidValueObject;

  constructor(input: QrFindByIdQueryInput) {
    this.qrId = new UuidValueObject(input.qrId);
  }
}

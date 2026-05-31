export interface QrFindByIdQueryInput {
  qrId: string;
}

export class QrFindByIdQuery {
  public readonly qrId: string;

  constructor(input: QrFindByIdQueryInput) {
    this.qrId = input.qrId;
  }
}

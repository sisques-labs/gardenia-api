export interface QrFindPngByIdQueryInput {
  qrId: string;
}

export class QrFindPngByIdQuery {
  public readonly qrId: string;

  constructor(input: QrFindPngByIdQueryInput) {
    this.qrId = input.qrId;
  }
}

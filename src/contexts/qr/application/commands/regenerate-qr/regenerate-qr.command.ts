export interface RegenerateQrCommandInput {
  qrId: string;
}

export class RegenerateQrCommand {
  public readonly qrId: string;

  constructor(input: RegenerateQrCommandInput) {
    this.qrId = input.qrId;
  }
}

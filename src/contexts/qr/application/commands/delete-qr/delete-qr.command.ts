export interface DeleteQrCommandInput {
  qrId: string;
}

export class DeleteQrCommand {
  public readonly qrId: string;

  constructor(input: DeleteQrCommandInput) {
    this.qrId = input.qrId;
  }
}

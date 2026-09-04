import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface DeleteQrCommandInput {
  qrId: string;
}

export class DeleteQrCommand {
  public readonly qrId: UuidValueObject;

  constructor(input: DeleteQrCommandInput) {
    this.qrId = new UuidValueObject(input.qrId);
  }
}

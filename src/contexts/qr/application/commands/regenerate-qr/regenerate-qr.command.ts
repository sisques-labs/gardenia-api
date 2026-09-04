import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface RegenerateQrCommandInput {
  qrId: string;
}

export class RegenerateQrCommand {
  public readonly qrId: UuidValueObject;

  constructor(input: RegenerateQrCommandInput) {
    this.qrId = new UuidValueObject(input.qrId);
  }
}

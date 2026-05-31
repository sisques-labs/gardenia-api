export interface CreateQrCommandInput {
  targetUrl: string;
  spaceId: string;
}

export class CreateQrCommand {
  public readonly targetUrl: string;
  public readonly spaceId: string;

  constructor(input: CreateQrCommandInput) {
    this.targetUrl = input.targetUrl;
    this.spaceId = input.spaceId;
  }
}

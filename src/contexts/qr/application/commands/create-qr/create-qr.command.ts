export interface CreateQrCommandInput {
  targetUrl: string;
  spaceId: string;
  /** Optional plant owner for DB FK (ON DELETE CASCADE); not part of QrAggregate. */
  plantId?: string;
}

export class CreateQrCommand {
  public readonly targetUrl: string;
  public readonly spaceId: string;
  public readonly plantId?: string;

  constructor(input: CreateQrCommandInput) {
    this.targetUrl = input.targetUrl;
    this.spaceId = input.spaceId;
    this.plantId = input.plantId;
  }
}

export interface UpdateSpaceCommandInput {
  spaceId: string;
  latitude?: number | null;
  longitude?: number | null;
  environment?: string | null;
  requestingUserId: string;
}

export class UpdateSpaceCommand {
  public readonly spaceId: string;
  public readonly latitude?: number | null;
  public readonly longitude?: number | null;
  public readonly environment?: string | null;
  public readonly requestingUserId: string;

  constructor(input: UpdateSpaceCommandInput) {
    this.spaceId = input.spaceId;
    this.latitude = input.latitude;
    this.longitude = input.longitude;
    this.environment = input.environment;
    this.requestingUserId = input.requestingUserId;
  }
}

import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';

export interface UpdateSpaceGeolocationCommandInput {
  spaceId: string;
  latitude: number | null;
  longitude: number | null;
  environment: SpaceEnvironmentEnum | null;
  requestingUserId: string;
}

export class UpdateSpaceGeolocationCommand {
  public readonly spaceId: string;
  public readonly latitude: number | null;
  public readonly longitude: number | null;
  public readonly environment: SpaceEnvironmentEnum | null;
  public readonly requestingUserId: string;

  constructor(input: UpdateSpaceGeolocationCommandInput) {
    this.spaceId = input.spaceId;
    this.latitude = input.latitude;
    this.longitude = input.longitude;
    this.environment = input.environment;
    this.requestingUserId = input.requestingUserId;
  }
}

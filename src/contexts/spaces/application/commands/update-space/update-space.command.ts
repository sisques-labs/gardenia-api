import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
import { SpaceEnvironmentValueObject } from '@contexts/spaces/domain/value-objects/space-environment/space-environment.value-object';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';
import { SpaceLatitudeValueObject } from '@contexts/spaces/domain/value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '@contexts/spaces/domain/value-objects/space-longitude/space-longitude.value-object';

export interface UpdateSpaceCommandInput {
  spaceId: string;
  latitude?: number | null;
  longitude?: number | null;
  environment?: string | null;
  requestingUserId: string;
}

export class UpdateSpaceCommand {
  public readonly spaceId: SpaceIdValueObject;
  public readonly latitude?: SpaceLatitudeValueObject | null;
  public readonly longitude?: SpaceLongitudeValueObject | null;
  public readonly environment?: SpaceEnvironmentValueObject | null;
  public readonly requestingUserId: string;

  constructor(input: UpdateSpaceCommandInput) {
    this.spaceId = new SpaceIdValueObject(input.spaceId);
    this.latitude =
      input.latitude !== undefined
        ? input.latitude != null
          ? new SpaceLatitudeValueObject(input.latitude)
          : null
        : undefined;
    this.longitude =
      input.longitude !== undefined
        ? input.longitude != null
          ? new SpaceLongitudeValueObject(input.longitude)
          : null
        : undefined;
    this.environment =
      input.environment !== undefined
        ? input.environment != null
          ? new SpaceEnvironmentValueObject(input.environment as SpaceEnvironmentEnum)
          : null
        : undefined;
    this.requestingUserId = input.requestingUserId;
  }
}

import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

export type GetSpaceWeatherQueryInput = { spaceId: string };

export class GetSpaceWeatherQuery {
  public readonly spaceId: SpaceIdValueObject;

  constructor(input: GetSpaceWeatherQueryInput) {
    this.spaceId = new SpaceIdValueObject(input.spaceId);
  }
}

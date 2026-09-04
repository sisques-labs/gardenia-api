import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type GetSpaceWeatherQueryInput = { spaceId: string };

export class GetSpaceWeatherQuery {
  public readonly spaceId: UuidValueObject;

  constructor(input: GetSpaceWeatherQueryInput) {
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';

export type MarkPlantingSpotActiveCommandInput = Pick<
  IPlantingSpotPrimitives,
  'spaceId' | 'id'
> & {
  requestingUserId: string;
};

export class MarkPlantingSpotActiveCommand {
  public readonly id: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: MarkPlantingSpotActiveCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

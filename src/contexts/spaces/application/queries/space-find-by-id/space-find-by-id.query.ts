import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

export type SpaceFindByIdQueryInput = { spaceId: string };

export class SpaceFindByIdQuery {
  public readonly spaceId: SpaceIdValueObject;

  constructor(input: SpaceFindByIdQueryInput) {
    this.spaceId = new SpaceIdValueObject(input.spaceId);
  }
}

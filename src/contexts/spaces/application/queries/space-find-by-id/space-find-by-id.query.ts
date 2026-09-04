import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type SpaceFindByIdQueryInput = { spaceId: string };

export class SpaceFindByIdQuery {
  public readonly spaceId: UuidValueObject;

  constructor(input: SpaceFindByIdQueryInput) {
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

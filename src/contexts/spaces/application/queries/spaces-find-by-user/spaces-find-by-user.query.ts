import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type SpacesFindByUserQueryInput = { userId: string };

export class SpacesFindByUserQuery {
  public readonly userId: UuidValueObject;

  constructor(input: SpacesFindByUserQueryInput) {
    this.userId = new UuidValueObject(input.userId);
  }
}

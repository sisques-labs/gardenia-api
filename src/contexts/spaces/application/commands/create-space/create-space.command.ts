import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceNameValueObject } from '@contexts/spaces/domain/value-objects/space-name/space-name.value-object';

export interface CreateSpaceCommandInput {
  name: string;
  ownerId: string;
}

export class CreateSpaceCommand {
  public readonly name: SpaceNameValueObject;
  public readonly ownerId: UuidValueObject;

  constructor(input: CreateSpaceCommandInput) {
    this.name = new SpaceNameValueObject(input.name);
    this.ownerId = new UuidValueObject(input.ownerId);
  }
}

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceNameValueObject } from '@contexts/spaces/domain/value-objects/space-name/space-name.value-object';

export interface CreateSpaceCommandInput {
  name: string;
  ownerId: string;
  /**
   * The acting user's own verified platform (Sisques Account) bearer token,
   * when the request is platform-linked (design.md D7). `null`/omitted means
   * a native (non-platform) request — today's local-id behavior is preserved
   * unchanged.
   */
  platformAccessToken?: string | null;
}

export class CreateSpaceCommand {
  public readonly name: SpaceNameValueObject;
  public readonly ownerId: UuidValueObject;
  public readonly platformAccessToken: string | null;

  constructor(input: CreateSpaceCommandInput) {
    this.name = new SpaceNameValueObject(input.name);
    this.ownerId = new UuidValueObject(input.ownerId);
    this.platformAccessToken = input.platformAccessToken ?? null;
  }
}

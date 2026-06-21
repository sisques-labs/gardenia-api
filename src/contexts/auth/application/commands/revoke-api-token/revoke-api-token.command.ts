import { ApiTokenIdValueObject } from '@contexts/auth/domain/value-objects/api-token-id/api-token-id.vo';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface RevokeApiTokenCommandInput {
  tokenId: string;
  userId: string;
}

export class RevokeApiTokenCommand {
  public readonly tokenId: ApiTokenIdValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: RevokeApiTokenCommandInput) {
    this.tokenId = new ApiTokenIdValueObject(input.tokenId);
    this.userId = new UuidValueObject(input.userId);
  }
}

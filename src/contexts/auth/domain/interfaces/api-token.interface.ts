import { ApiTokenHashValueObject } from '@contexts/auth/domain/value-objects/api-token-hash/api-token-hash.vo';
import { ApiTokenIdValueObject } from '@contexts/auth/domain/value-objects/api-token-id/api-token-id.vo';
import { ApiTokenLabelValueObject } from '@contexts/auth/domain/value-objects/api-token-label/api-token-label.vo';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IApiToken {
  id: ApiTokenIdValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  label: ApiTokenLabelValueObject;
  tokenHash: ApiTokenHashValueObject;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: DateValueObject | null;
  updatedAt: DateValueObject | null;
}

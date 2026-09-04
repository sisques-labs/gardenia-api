import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IAuthSession {
  id: UuidValueObject;
  userId: UuidValueObject;
  tokenHash: RefreshTokenHashValueObject;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceInfo: string | null;
  replacedBySessionId: string | null;
  createdAt: DateValueObject | null;
  updatedAt: DateValueObject | null;
}

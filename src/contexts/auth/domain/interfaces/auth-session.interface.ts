import { AuthSessionIdValueObject } from '@contexts/auth/domain/value-objects/auth-session-id/auth-session-id.vo';
import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface IAuthSession {
  id: AuthSessionIdValueObject;
  userId: UuidValueObject;
  tokenHash: RefreshTokenHashValueObject;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceInfo: string | null;
  createdAt: DateValueObject | null;
  updatedAt: DateValueObject | null;
}

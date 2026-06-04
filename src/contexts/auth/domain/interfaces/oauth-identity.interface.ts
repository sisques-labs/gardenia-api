import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export interface IOAuthIdentity {
  id: UuidValueObject;
  userId: UuidValueObject;
  provider: OAuthProviderValueObject;
  providerUserId: StringValueObject;
  email: AccountEmailValueObject | null;
  emailVerified: boolean;
  accessTokenEnc: string | null;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
  createdAt: DateValueObject | null;
  updatedAt: DateValueObject | null;
}

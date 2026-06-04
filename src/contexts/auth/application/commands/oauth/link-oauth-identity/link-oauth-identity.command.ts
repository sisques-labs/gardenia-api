import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import {
  BooleanValueObject,
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export interface LinkOAuthIdentityCommandInput {
  userId: string;
  providerUserId: string;
  provider: string;
  email: string | null;
  emailVerified: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}

export class LinkOAuthIdentityCommand {
  public readonly userId: UuidValueObject;
  public readonly providerUserId: StringValueObject;
  public readonly provider: OAuthProviderValueObject;
  public readonly email: AccountEmailValueObject | null;
  public readonly emailVerified: BooleanValueObject;
  public readonly accessToken: StringValueObject | null;
  public readonly refreshToken: StringValueObject | null;
  public readonly tokenExpiresAt: DateValueObject | null;

  constructor(input: LinkOAuthIdentityCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.providerUserId = new StringValueObject(input.providerUserId);
    this.provider = new OAuthProviderValueObject(input.provider);
    this.email = input.email ? new AccountEmailValueObject(input.email) : null;
    this.emailVerified = new BooleanValueObject(input.emailVerified);
    this.accessToken = input.accessToken
      ? new StringValueObject(input.accessToken)
      : null;
    this.refreshToken = input.refreshToken
      ? new StringValueObject(input.refreshToken)
      : null;
    this.tokenExpiresAt = input.tokenExpiresAt
      ? new DateValueObject(input.tokenExpiresAt)
      : null;
  }
}

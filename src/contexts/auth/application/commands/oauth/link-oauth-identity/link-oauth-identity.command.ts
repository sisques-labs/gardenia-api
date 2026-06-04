import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import { StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

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
  public readonly email: string | null;
  public readonly emailVerified: boolean;
  public readonly accessToken: string | null;
  public readonly refreshToken: string | null;
  public readonly tokenExpiresAt: Date | null;

  constructor(input: LinkOAuthIdentityCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.providerUserId = new StringValueObject(input.providerUserId);
    this.provider = new OAuthProviderValueObject(input.provider);
    this.email = input.email;
    this.emailVerified = input.emailVerified;
    this.accessToken = input.accessToken;
    this.refreshToken = input.refreshToken;
    this.tokenExpiresAt = input.tokenExpiresAt;
  }
}

import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import { StringValueObject } from '@sisques-labs/nestjs-kit';

export interface LoginWithOAuthCommandInput {
  providerUserId: string;
  provider: string;
  email: string | null;
  emailVerified: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  deviceInfo?: string;
}

export class LoginWithOAuthCommand {
  public readonly providerUserId: StringValueObject;
  public readonly provider: OAuthProviderValueObject;
  public readonly email: string | null;
  public readonly emailVerified: boolean;
  public readonly accessToken: string | null;
  public readonly refreshToken: string | null;
  public readonly tokenExpiresAt: Date | null;
  public readonly deviceInfo: string | undefined;

  constructor(input: LoginWithOAuthCommandInput) {
    this.providerUserId = new StringValueObject(input.providerUserId);
    this.provider = new OAuthProviderValueObject(input.provider);
    this.email = input.email;
    this.emailVerified = input.emailVerified;
    this.accessToken = input.accessToken;
    this.refreshToken = input.refreshToken;
    this.tokenExpiresAt = input.tokenExpiresAt;
    this.deviceInfo = input.deviceInfo;
  }
}

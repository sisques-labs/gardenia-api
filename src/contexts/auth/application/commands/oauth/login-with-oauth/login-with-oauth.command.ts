import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';

export class LoginWithOAuthCommand {
  constructor(
    public readonly profile: OAuthUserProfile,
    public readonly deviceInfo?: string,
  ) {}
}

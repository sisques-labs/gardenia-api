import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';

export class LinkOAuthIdentityCommand {
  constructor(
    public readonly userId: string,
    public readonly profile: OAuthUserProfile,
  ) {}
}

import { OAuthProviderName } from '@contexts/auth/domain/enums/oauth-provider.enum';

export type { OAuthProviderName };

export interface OAuthUserProfile {
  provider: OAuthProviderName;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  rawTokens: {
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
  };
}

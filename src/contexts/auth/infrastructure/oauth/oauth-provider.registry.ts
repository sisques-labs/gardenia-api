import { Injectable, NotFoundException } from '@nestjs/common';

import { OAuthProviderName } from '@contexts/auth/application/ports/oauth-user-profile';

export const OAUTH_STRATEGIES = Symbol('OAUTH_STRATEGIES');

/**
 * Thin registry that maps an OAuthProviderName to the corresponding
 * Passport strategy name (the string passed to PassportStrategy).
 *
 * The DynamicOAuthGuard uses this to validate that a requested provider
 * is known before delegating to AuthGuard(provider).
 */
@Injectable()
export class OAuthProviderRegistry {
  private static readonly KNOWN_PROVIDERS: ReadonlySet<OAuthProviderName> =
    new Set(['google', 'github', 'apple']);

  isKnown(provider: string): provider is OAuthProviderName {
    return OAuthProviderRegistry.KNOWN_PROVIDERS.has(
      provider as OAuthProviderName,
    );
  }

  assertKnown(provider: string): OAuthProviderName {
    if (!this.isKnown(provider)) {
      throw new NotFoundException(
        `OAuth provider "${provider}" is not configured`,
      );
    }
    return provider;
  }
}

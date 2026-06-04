import { Injectable, NotFoundException } from '@nestjs/common';

import {
  OAuthProviderEnum,
  OAuthProviderName,
} from '@contexts/auth/domain/enums/oauth-provider.enum';

export const OAUTH_STRATEGIES = Symbol('OAUTH_STRATEGIES');

@Injectable()
export class OAuthProviderRegistry {
  private static readonly KNOWN_PROVIDERS: ReadonlySet<OAuthProviderName> =
    new Set(Object.values(OAuthProviderEnum) as OAuthProviderName[]);

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

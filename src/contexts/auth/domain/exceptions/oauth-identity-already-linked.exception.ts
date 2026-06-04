import { BaseException } from '@sisques-labs/nestjs-kit';

export class OAuthIdentityAlreadyLinkedException extends BaseException {
  constructor(provider: string, providerUserId: string) {
    super(
      `OAuth identity '${providerUserId}' for provider '${provider}' is already linked to another account`,
    );
  }
}

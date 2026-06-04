import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { OAuthProviderRegistry } from '../oauth/oauth-provider.registry';

/**
 * Reads `:provider` from the route params and dynamically delegates to
 * AuthGuard('google' | 'github' | 'apple').
 *
 * Throws BadRequestException for unknown providers so the response is 400,
 * not the default Passport 401.
 */
@Injectable()
export class DynamicOAuthGuard {
  constructor(private readonly registry: OAuthProviderRegistry) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawProvider = request.params['provider'];
    const provider = Array.isArray(rawProvider) ? rawProvider[0] : rawProvider;

    if (!provider || !this.registry.isKnown(provider)) {
      throw new BadRequestException(
        `Unknown OAuth provider: "${provider ?? ''}". Supported: google, github, apple.`,
      );
    }

    const knownProvider = this.registry.assertKnown(provider);
    const Guard = AuthGuard(knownProvider);
    const guard = new Guard();
    return guard.canActivate(context) as Promise<boolean>;
  }
}

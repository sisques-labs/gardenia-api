import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';

import { API_TOKEN_PREFIX } from '@contexts/auth/application/constants/api-token.constants';
import { ApiTokenAuthenticateQuery } from '@contexts/auth/application/queries/api-token-authenticate/api-token-authenticate.query';
import { ApiTokenAuthenticationResult } from '@contexts/auth/application/queries/api-token-authenticate/api-token-authentication.result';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { SKIP_SPACE_KEY } from '../../../../shared/decorators/skip-space.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

// Global APP_GUARD that runs before SpaceGuard.
// Routes marked @SkipSpace() bypass JWT validation entirely (register, login,
// refresh, logout). All other routes require a valid JWT — invalid or expired
// tokens still throw 401. This avoids passport-jwt wrapping "No auth token"
// in a JsonWebTokenError, which would cause false 401s on public routes.
//
// In addition, a `Bearer ght_…` long-lived API token is resolved here to its
// owner + scoped space (req.user + req.spaceId), so non-interactive clients
// (e.g. Home Assistant's MCP client) authenticate without a JWT or X-Space-ID.
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipSpace = this.reflector.getAllAndOverride<boolean>(
      SKIP_SPACE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipSpace) return true;

    const request = this.getRequest(context) as {
      headers?: Record<string, string | string[] | undefined>;
      user?: unknown;
      spaceId?: string;
    };

    const apiToken = this.extractApiToken(request.headers?.authorization);
    if (apiToken) {
      await this.authenticateWithApiToken(apiToken, request);
      return true;
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err) throw err;
    if (!user) throw new UnauthorizedException(info?.message ?? 'Unauthorized');
    return user;
  }

  private extractApiToken(
    authorization: string | string[] | undefined,
  ): string | null {
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    if (!header?.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length);
    return token.startsWith(API_TOKEN_PREFIX) ? token : null;
  }

  private async authenticateWithApiToken(
    rawToken: string,
    request: { user?: unknown; spaceId?: string },
  ): Promise<void> {
    const result = await this.queryBus.execute<
      ApiTokenAuthenticateQuery,
      ApiTokenAuthenticationResult | null
    >(new ApiTokenAuthenticateQuery({ rawToken }));

    if (!result) {
      throw new UnauthorizedException('Invalid API token');
    }

    // API tokens carry no email/app-role: they act as the owning USER, scoped
    // to the token's space (so SpaceGuard does not need X-Space-ID).
    request.user = {
      userId: result.userId,
      email: '',
      appRole: AppRoleEnum.USER,
    };
    request.spaceId = result.spaceId;
  }
}

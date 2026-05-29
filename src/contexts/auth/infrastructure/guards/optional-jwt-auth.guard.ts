import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_SPACE_KEY } from '../../../../shared/decorators/skip-space.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

// Global APP_GUARD that runs before SpaceGuard.
// Routes marked @SkipSpace() bypass JWT validation entirely (register, login,
// refresh, logout). All other routes require a valid JWT — invalid or expired
// tokens still throw 401. This avoids passport-jwt wrapping "No auth token"
// in a JsonWebTokenError, which would cause false 401s on public routes.
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipSpace = this.reflector.getAllAndOverride<boolean>(
      SKIP_SPACE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skipSpace) return true;
    return super.canActivate(context) as Promise<boolean>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err) throw err;
    if (!user) throw new UnauthorizedException(info?.message ?? 'Unauthorized');
    return user;
  }
}

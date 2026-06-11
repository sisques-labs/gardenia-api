import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { APP_ROLE_KEY } from '@shared/decorators/require-app-role.decorator';

/**
 * Opt-in role guard for app-level RBAC.
 *
 * Usage order: @UseGuards(JwtAuthGuard, AppRoleGuard)
 * JwtAuthGuard MUST run first to populate req.user.appRole.
 *
 * Behavior:
 *  - No @RequireAppRole metadata → pass (guard is opt-in)
 *  - No req.user → 401
 *  - req.user.appRole not in required roles → 403
 *  - Match → pass
 */
@Injectable()
export class AppRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppRoleEnum[]>(
      APP_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = this.getRequest(context);
    const user = req['user'] as { appRole?: AppRoleEnum } | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.appRole || !requiredRoles.includes(user.appRole)) {
      throw new ForbiddenException('Insufficient app role');
    }

    return true;
  }

  private getRequest(context: ExecutionContext): Record<string, unknown> {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: Record<string, unknown>;
      }>().req;
    }
    return context.switchToHttp().getRequest<Record<string, unknown>>();
  }
}

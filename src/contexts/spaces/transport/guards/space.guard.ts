// ALS Decision: SpaceContext is set by SpaceInterceptor (not this guard).
// Guards resolve before the handler executes; ALS run() in a guard closes
// before the handler chain completes. SpaceInterceptor wraps next.handle()
// ensuring the ALS frame covers the full request lifecycle.

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';

import { MembershipFindByUserAndSpaceQuery } from '@contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.query';
import { SKIP_SPACE_KEY } from '../../../../shared/decorators/skip-space.decorator';

@Injectable()
export class SpaceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipSpace = this.reflector.getAllAndOverride<boolean>(
      SKIP_SPACE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipSpace) return true;

    const req = this.getRequest(context);

    const user = req['user'] as { userId: string; email: string } | undefined;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const headers = req['headers'] as
      | Record<string, string | string[] | undefined>
      | undefined;
    const spaceId = headers?.['x-space-id'] as string | undefined;
    if (!spaceId || spaceId.trim() === '') {
      throw new BadRequestException('X-Space-ID header is required');
    }

    const membership = await this.queryBus.execute(
      new MembershipFindByUserAndSpaceQuery({ userId: user.userId, spaceId }),
    );

    if (!membership) {
      throw new ForbiddenException('User is not a member of this space');
    }

    req['spaceId'] = spaceId;
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

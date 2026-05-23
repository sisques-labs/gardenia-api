import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserPayload {
  userId: string;
  email: string;
}

/**
 * Stub @CurrentUser() decorator.
 * Extracts req.user from HTTP context or GQL context.
 * Phase 7 will wire the real JWT payload here.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    if (ctx.getType<string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(ctx);
      return gqlCtx.getContext<{ req: { user: CurrentUserPayload } }>().req
        .user as CurrentUserPayload;
    }
    const request = ctx.switchToHttp().getRequest<{ user: CurrentUserPayload }>();
    return request.user;
  },
);

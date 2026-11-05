import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

// Dual-issuer acceptance (P1, opt-in via SISQUES_ACCOUNT_AUTH_ENABLED — see
// design D1). 'jwt' is tried first, so gardenia-issued tokens behave
// identically to today regardless of this flag. Read once at module load
// (dotenv is loaded before AppModule imports — see src/main.ts / telemetry.ts)
// so a config-only rollback (flip the flag, no code change) is possible.
const JWT_STRATEGIES: string[] =
  process.env.SISQUES_ACCOUNT_AUTH_ENABLED === 'true'
    ? ['jwt', 'sisques-account']
    : ['jwt'];

@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGIES) {
  override getRequest(context: ExecutionContext): unknown {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: unknown;
      }>().req;
    }
    return context.switchToHttp().getRequest();
  }
}

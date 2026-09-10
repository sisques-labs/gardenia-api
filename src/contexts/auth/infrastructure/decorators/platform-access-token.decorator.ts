import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface RequestWithHeaders {
  headers?: Record<string, string | string[] | undefined>;
}

const BEARER_PREFIX = 'Bearer ';

/**
 * Extracts the caller's own raw platform (Sisques Account) bearer token from
 * the `Authorization` header — but ONLY when that token was verified via
 * P1's RS256 `sisques-account` strategy, never gardenia's own native HS256
 * tokens (`JwtStrategy`/`TokenService.sign()` — see D2/D3).
 *
 * Distinguishing the two issuers here is a safe, zero-dependency, DECODE-ONLY
 * check (no re-verification): D2 pins the `sisques-account` strategy to
 * `algorithms:['RS256']` specifically so "an HS256 token can never verify
 * against a JWKS key or vice-versa" — the two issuers are disjoint by
 * construction, so the unverified header `alg` is a reliable signal for a
 * token that has ALREADY passed `JwtAuthGuard`'s real verification.
 *
 * `CurrentUserPayload`/`validate()` deliberately stay `{userId,email,appRole}`
 * only (D3) — this decorator reads the header directly instead of widening
 * that shared shape, so `SpaceGuard`, `AppRoleGuard` and every other
 * `@CurrentUser()` consumer stay untouched.
 *
 * Returns `null` for a native (non-platform) request — see D7.
 */
export const PlatformAccessToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = extractRequest(ctx);
    const authHeader = request?.headers?.['authorization'];
    return extractPlatformAccessToken(
      Array.isArray(authHeader) ? authHeader[0] : authHeader,
    );
  },
);

function extractRequest(ctx: ExecutionContext): RequestWithHeaders | undefined {
  if (ctx.getType<string>() === 'graphql') {
    const gqlCtx = GqlExecutionContext.create(ctx);
    return gqlCtx.getContext<{ req: RequestWithHeaders }>().req;
  }
  return ctx.switchToHttp().getRequest<RequestWithHeaders>();
}

/**
 * Pure function — see class doc above for the RS256-vs-HS256 rationale.
 * Exported directly so the decision logic is unit-testable without mocking
 * `ExecutionContext`/GraphQL context (Extract-Before-Mock rule).
 */
export function extractPlatformAccessToken(
  authorizationHeader: string | undefined,
): string | null {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length);
  const headerSegment = token.split('.')[0];
  if (!headerSegment) {
    return null;
  }

  try {
    const header = JSON.parse(
      Buffer.from(headerSegment, 'base64url').toString('utf8'),
    ) as { alg?: string };
    return header.alg === 'RS256' ? token : null;
  } catch {
    return null;
  }
}

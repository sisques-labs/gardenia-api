import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

// Used as global APP_GUARD. Decodes JWT if present and sets req.user,
// but does NOT throw when no token is provided — public routes (register,
// login, refresh) pass through without a token. Invalid or expired tokens
// still throw 401. SpaceGuard (the next global guard) enforces auth for
// all non-@SkipSpace routes by checking req.user.
@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err) throw err;
    if (!user && info instanceof Error) {
      // Invalid or expired token — throw so the client knows to re-authenticate
      throw new UnauthorizedException(info.message);
    }
    // No token at all (info is a string) — pass with user=undefined
    return user || undefined;
  }
}

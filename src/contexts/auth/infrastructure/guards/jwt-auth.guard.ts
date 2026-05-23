import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Stub JwtAuthGuard — always passes through.
 * Phase 7 will replace this with the real JWT strategy implementation.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(): boolean {
    return true;
  }
}

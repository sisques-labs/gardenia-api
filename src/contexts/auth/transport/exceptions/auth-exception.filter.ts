import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { InvalidRefreshTokenHashException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-hash.exception';
import { InvalidRefreshTokenValueException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-value.exception';
import { InvalidRefreshTokenException } from '@contexts/auth/domain/exceptions/invalid-refresh-token.exception';
import { RefreshTokenReuseDetectedException } from '@contexts/auth/domain/exceptions/refresh-token-reuse-detected.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveAuthExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof AccountAlreadyExistsException) {
    return HttpStatus.CONFLICT;
  }
  if (exception instanceof AccountNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (
    exception instanceof InvalidCredentialsException ||
    exception instanceof InvalidRefreshTokenException ||
    exception instanceof RefreshTokenReuseDetectedException
  ) {
    return HttpStatus.UNAUTHORIZED;
  }
  if (
    exception instanceof InvalidRefreshTokenHashException ||
    exception instanceof InvalidRefreshTokenValueException
  ) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return null;
}

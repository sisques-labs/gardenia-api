import { QrExpiresAtInvalidError } from '@contexts/qr/domain/exceptions/qr-expires-at-invalid.error';
import { QrExpiredError } from '@contexts/qr/domain/exceptions/qr-expired.error';
import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveQrExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof QrNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof QrExpiredError) {
    return HttpStatus.GONE;
  }
  if (exception instanceof QrExpiresAtInvalidError) {
    return HttpStatus.BAD_REQUEST;
  }
  return null;
}

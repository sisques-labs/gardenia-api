import { QrNotFoundException } from '@contexts/qr/domain/exceptions/qr-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveQrExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof QrNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}

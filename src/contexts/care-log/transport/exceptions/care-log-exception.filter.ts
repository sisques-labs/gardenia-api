import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import { CareLogQuantityUnitMismatchException } from '@contexts/care-log/domain/exceptions/care-log-quantity-unit-mismatch.exception';

export function resolveCareLogExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof CareLogEntryNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof CareLogQuantityUnitMismatchException) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  return null;
}

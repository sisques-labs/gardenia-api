import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveHarvestsExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof HarvestNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}

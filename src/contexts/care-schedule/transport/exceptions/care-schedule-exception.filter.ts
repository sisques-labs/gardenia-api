import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { CareScheduleNotFoundException } from '@contexts/care-schedule/domain/exceptions/care-schedule-not-found.exception';

export function resolveCareScheduleExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof CareScheduleNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}

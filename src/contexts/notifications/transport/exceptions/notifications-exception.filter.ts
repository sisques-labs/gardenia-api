import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { NotificationNotFoundException } from '@contexts/notifications/domain/exceptions/notification-not-found.exception';
import { NotificationNotOwnedException } from '@contexts/notifications/domain/exceptions/notification-not-owned.exception';

export function resolveNotificationsExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof NotificationNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  if (exception instanceof NotificationNotOwnedException) {
    return HttpStatus.FORBIDDEN;
  }
  return null;
}

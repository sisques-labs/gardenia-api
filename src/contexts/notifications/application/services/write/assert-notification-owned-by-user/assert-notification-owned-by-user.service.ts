import { Injectable } from '@nestjs/common';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationNotOwnedException } from '@contexts/notifications/domain/exceptions/notification-not-owned.exception';

@Injectable()
export class AssertNotificationOwnedByUserService {
  execute(
    notification: NotificationAggregate,
    requestingUserId: UuidValueObject,
  ): void {
    if (notification.userId.value !== requestingUserId.value) {
      throw new NotificationNotOwnedException(notification.id.value);
    }
  }
}

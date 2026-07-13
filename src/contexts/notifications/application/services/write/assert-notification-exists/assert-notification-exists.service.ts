import { Inject, Injectable } from '@nestjs/common';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationNotFoundException } from '@contexts/notifications/domain/exceptions/notification-not-found.exception';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';

@Injectable()
export class AssertNotificationExistsService {
  constructor(
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
  ) {}

  async execute(id: NotificationIdValueObject): Promise<NotificationAggregate> {
    const notification = await this.notificationWriteRepository.findById(
      id.value,
    );
    if (!notification) throw new NotificationNotFoundException(id.value);
    return notification;
  }
}

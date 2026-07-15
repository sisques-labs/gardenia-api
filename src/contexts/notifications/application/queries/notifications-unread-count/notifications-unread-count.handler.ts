import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  NOTIFICATION_READ_REPOSITORY,
  INotificationReadRepository,
} from '@contexts/notifications/domain/repositories/read/notification-read.repository';

import { NotificationsUnreadCountQuery } from './notifications-unread-count.query';

@QueryHandler(NotificationsUnreadCountQuery)
export class NotificationsUnreadCountQueryHandler implements IQueryHandler<
  NotificationsUnreadCountQuery,
  number
> {
  private readonly logger = new Logger(
    NotificationsUnreadCountQueryHandler.name,
  );

  constructor(
    @Inject(NOTIFICATION_READ_REPOSITORY)
    private readonly notificationReadRepository: INotificationReadRepository,
  ) {}

  async execute(query: NotificationsUnreadCountQuery): Promise<number> {
    this.logger.log(
      `Executing NotificationsUnreadCountQuery for user: ${query.userId.value}`,
    );
    return this.notificationReadRepository.countUnread(query.userId.value);
  }
}

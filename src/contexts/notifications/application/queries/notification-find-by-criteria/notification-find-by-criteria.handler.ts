import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import {
  NOTIFICATION_READ_REPOSITORY,
  INotificationReadRepository,
} from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';

import { NotificationFindByCriteriaQuery } from './notification-find-by-criteria.query';

@QueryHandler(NotificationFindByCriteriaQuery)
export class NotificationFindByCriteriaQueryHandler implements IQueryHandler<
  NotificationFindByCriteriaQuery,
  PaginatedResult<NotificationViewModel>
> {
  private readonly logger = new Logger(
    NotificationFindByCriteriaQueryHandler.name,
  );

  constructor(
    @Inject(NOTIFICATION_READ_REPOSITORY)
    private readonly notificationReadRepository: INotificationReadRepository,
  ) {}

  async execute(
    query: NotificationFindByCriteriaQuery,
  ): Promise<PaginatedResult<NotificationViewModel>> {
    this.logger.log(
      `Executing NotificationFindByCriteriaQuery for user: ${query.userId.value}`,
    );
    return this.notificationReadRepository.findByCriteria(
      query.userId.value,
      query.criteria,
    );
  }
}

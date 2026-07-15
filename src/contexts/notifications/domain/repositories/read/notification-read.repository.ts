import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';

export const NOTIFICATION_READ_REPOSITORY = Symbol(
  'NOTIFICATION_READ_REPOSITORY',
);

/**
 * Deliberately does NOT extend IBaseReadRepository<NotificationViewModel>:
 * a notification's recipient (userId) is a mandatory scoping dimension on
 * top of space_id (handled ambiently via SpaceContext, like every other
 * tenant-scoped repo) that the generic interface has no room for. userId is
 * always passed explicitly and enforced server-side — never sourced from
 * client-supplied Criteria filters — so one user can never query another's
 * notifications regardless of filter values supplied.
 */
export interface INotificationReadRepository {
  findById(id: string): Promise<NotificationViewModel | null>;
  findByCriteria(
    userId: string,
    criteria: Criteria,
  ): Promise<PaginatedResult<NotificationViewModel>>;
  countUnread(userId: string): Promise<number>;
  findOpenByDedupeKey(dedupeKey: string): Promise<NotificationViewModel[]>;
}

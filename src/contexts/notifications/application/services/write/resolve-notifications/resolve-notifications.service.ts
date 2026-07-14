import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';

export interface ResolveNotificationsServiceInput {
  open: { id: string }[];
  dedupeKey: string;
}

/**
 * Resolves every open notification sharing a dedupeKey — the fan-in half of
 * the open/resolve pair, called when a source context reports its condition
 * cleared.
 */
@Injectable()
export class ResolveNotificationsService implements IBaseService<
  ResolveNotificationsServiceInput,
  void
> {
  private readonly logger = new Logger(ResolveNotificationsService.name);

  constructor(
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ResolveNotificationsServiceInput): Promise<void> {
    if (input.open.length === 0) return;

    const aggregates = await Promise.all(
      input.open.map((viewModel) =>
        this.notificationWriteRepository.findById(viewModel.id),
      ),
    );
    const resolved = aggregates.filter(
      (aggregate): aggregate is NotificationAggregate => aggregate !== null,
    );
    resolved.forEach((notification) => notification.resolve());

    await this.notificationWriteRepository.saveMany(resolved);
    for (const notification of resolved) {
      await this.eventBus.publishAll(notification.getUncommittedEvents());
      await notification.commit();
    }

    this.logger.log(
      `Notification resolved for dedupeKey ${input.dedupeKey} — ${resolved.length} recipient(s)`,
    );
  }
}

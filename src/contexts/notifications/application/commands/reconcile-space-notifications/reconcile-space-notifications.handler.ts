import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  CARE_SCHEDULE_ALERTS_PORT,
  ICareScheduleAlertsPort,
} from '@contexts/notifications/application/ports/care-schedule-alerts.port';
import {
  INVENTORY_ALERTS_PORT,
  IInventoryAlertsPort,
} from '@contexts/notifications/application/ports/inventory-alerts.port';
import {
  NOTIFICATION_DISPATCHER_PORT,
  INotificationDispatcherPort,
} from '@contexts/notifications/application/ports/notification-dispatcher.port';
import {
  USER_DIRECTORY_PORT,
  IUserDirectoryPort,
} from '@contexts/notifications/application/ports/user-directory.port';
import { NotificationReconciliationService } from '@contexts/notifications/application/services/notification-reconciliation/notification-reconciliation.service';
import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import {
  NOTIFICATION_READ_REPOSITORY,
  INotificationReadRepository,
} from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { ReconcileSpaceNotificationsCommand } from './reconcile-space-notifications.command';

@CommandHandler(ReconcileSpaceNotificationsCommand)
export class ReconcileSpaceNotificationsCommandHandler
  extends BaseCommandHandler<
    ReconcileSpaceNotificationsCommand,
    NotificationAggregate
  >
  implements ICommandHandler<ReconcileSpaceNotificationsCommand, void>
{
  private readonly logger = new Logger(
    ReconcileSpaceNotificationsCommandHandler.name,
  );

  constructor(
    @Inject(CARE_SCHEDULE_ALERTS_PORT)
    private readonly careScheduleAlertsPort: ICareScheduleAlertsPort,
    @Inject(INVENTORY_ALERTS_PORT)
    private readonly inventoryAlertsPort: IInventoryAlertsPort,
    @Inject(USER_DIRECTORY_PORT)
    private readonly userDirectoryPort: IUserDirectoryPort,
    @Inject(NOTIFICATION_DISPATCHER_PORT)
    private readonly notificationDispatcherPort: INotificationDispatcherPort,
    @Inject(NOTIFICATION_READ_REPOSITORY)
    private readonly notificationReadRepository: INotificationReadRepository,
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    private readonly reconciliationService: NotificationReconciliationService,
    private readonly notificationBuilder: NotificationBuilder,
    private readonly spaceContext: SpaceContext,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: ReconcileSpaceNotificationsCommand): Promise<void> {
    const spaceId = this.spaceContext.require();

    const [
      dueSchedules,
      lowStockItems,
      expiringItems,
      memberUserIds,
      openGroups,
    ] = await Promise.all([
      this.careScheduleAlertsPort.findDueWithin(
        command.careScheduleDueWindowHours.value,
      ),
      this.inventoryAlertsPort.findLowStock(),
      this.inventoryAlertsPort.findExpiringWithin(
        command.inventoryExpiringWindowDays.value,
      ),
      this.userDirectoryPort.listActiveMemberUserIds(),
      this.notificationReadRepository.findOpenGroupedByDedupeKey(),
    ]);

    const plan = this.reconciliationService.reconcile({
      dueSchedules,
      lowStockItems,
      expiringItems,
      openDedupeKeys: Array.from(openGroups.keys()),
    });

    const now = new Date();
    const created: NotificationAggregate[] = [];
    for (const entry of plan.toCreate) {
      for (const userId of memberUserIds) {
        const notification = this.notificationBuilder
          .withId(UuidValueObject.generate().value)
          .withType(entry.type)
          .withReferenceType(entry.referenceType)
          .withReferenceId(entry.referenceId)
          .withPayload(entry.payload)
          .withUserId(userId)
          .withSpaceId(spaceId)
          .withCreatedAt(now)
          .withUpdatedAt(now)
          .build();
        notification.create();
        created.push(notification);
      }
    }

    const resolved: NotificationAggregate[] = [];
    for (const dedupeKey of plan.toResolveDedupeKeys) {
      const group = openGroups.get(dedupeKey) ?? [];
      for (const viewModel of group) {
        const aggregate = await this.notificationWriteRepository.findById(
          viewModel.id,
        );
        if (!aggregate) continue;
        aggregate.resolve();
        resolved.push(aggregate);
      }
    }

    await this.notificationWriteRepository.saveMany([...created, ...resolved]);
    for (const notification of [...created, ...resolved]) {
      await this.publishEvents(notification);
    }
    for (const notification of created) {
      await this.notificationDispatcherPort.dispatch(
        new NotificationViewModel(notification.toPrimitives()),
      );
    }

    this.logger.log(
      `Reconciliation for space ${spaceId}: created ${created.length}, resolved ${resolved.length}`,
    );
  }
}

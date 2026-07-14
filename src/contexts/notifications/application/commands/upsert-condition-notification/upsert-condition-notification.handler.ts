import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  USER_DIRECTORY_PORT,
  IUserDirectoryPort,
} from '@contexts/notifications/application/ports/user-directory.port';
import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { NotificationTypeEnum } from '@contexts/notifications/domain/enums/notification-type.enum';
import {
  NOTIFICATION_READ_REPOSITORY,
  INotificationReadRepository,
} from '@contexts/notifications/domain/repositories/read/notification-read.repository';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { UpsertConditionNotificationCommand } from './upsert-condition-notification.command';

@CommandHandler(UpsertConditionNotificationCommand)
export class UpsertConditionNotificationCommandHandler
  extends BaseCommandHandler<
    UpsertConditionNotificationCommand,
    NotificationAggregate
  >
  implements ICommandHandler<UpsertConditionNotificationCommand, void>
{
  private readonly logger = new Logger(
    UpsertConditionNotificationCommandHandler.name,
  );

  constructor(
    @Inject(NOTIFICATION_READ_REPOSITORY)
    private readonly notificationReadRepository: INotificationReadRepository,
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    @Inject(USER_DIRECTORY_PORT)
    private readonly userDirectoryPort: IUserDirectoryPort,
    private readonly notificationBuilder: NotificationBuilder,
    private readonly spaceContext: SpaceContext,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpsertConditionNotificationCommand): Promise<void> {
    const spaceId = this.spaceContext.require();
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      command.type.value as NotificationTypeEnum,
      command.referenceId.value,
    );

    const open =
      await this.notificationReadRepository.findOpenByDedupeKey(dedupeKey);

    if (command.active.value) {
      await this.openNotification(command, spaceId, open.length > 0);
      return;
    }

    await this.resolveNotifications(open, dedupeKey);
  }

  private async openNotification(
    command: UpsertConditionNotificationCommand,
    spaceId: string,
    alreadyOpen: boolean,
  ): Promise<void> {
    if (alreadyOpen) return;

    const memberUserIds =
      await this.userDirectoryPort.listActiveMemberUserIds();
    const now = new Date();

    const created = memberUserIds.map((userId) =>
      this.notificationBuilder
        .withId(UuidValueObject.generate().value)
        .withType(command.type.value)
        .withReferenceType(command.referenceType.value)
        .withReferenceId(command.referenceId.value)
        .withPayload(command.payload.value)
        .withUserId(userId)
        .withSpaceId(spaceId)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build(),
    );
    created.forEach((notification) => notification.create());

    await this.notificationWriteRepository.saveMany(created);
    for (const notification of created) {
      await this.publishEvents(notification);
    }

    this.logger.log(
      `Notification opened for ${command.type.value}:${command.referenceId.value} — ${created.length} recipient(s)`,
    );
  }

  private async resolveNotifications(
    open: { id: string }[],
    dedupeKey: string,
  ): Promise<void> {
    if (open.length === 0) return;

    const aggregates = await Promise.all(
      open.map((viewModel) =>
        this.notificationWriteRepository.findById(viewModel.id),
      ),
    );
    const resolved = aggregates.filter(
      (aggregate): aggregate is NotificationAggregate => aggregate !== null,
    );
    resolved.forEach((notification) => notification.resolve());

    await this.notificationWriteRepository.saveMany(resolved);
    for (const notification of resolved) {
      await this.publishEvents(notification);
    }

    this.logger.log(
      `Notification resolved for dedupeKey ${dedupeKey} — ${resolved.length} recipient(s)`,
    );
  }
}

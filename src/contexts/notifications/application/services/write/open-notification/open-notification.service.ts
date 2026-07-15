import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { IBaseService, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  USER_DIRECTORY_PORT,
  IUserDirectoryPort,
} from '@contexts/notifications/application/ports/user-directory.port';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import {
  NOTIFICATION_WRITE_REPOSITORY,
  INotificationWriteRepository,
} from '@contexts/notifications/domain/repositories/write/notification-write.repository';

export interface OpenNotificationServiceInput {
  type: string;
  referenceType: string;
  referenceId: string;
  payload: Record<string, unknown>;
  spaceId: string;
}

/**
 * Fans out one notification per active space member for a newly-opened
 * condition. Called only when no notification is already open for the
 * dedupeKey (idempotency is enforced by the caller).
 */
@Injectable()
export class OpenNotificationService implements IBaseService<
  OpenNotificationServiceInput,
  void
> {
  private readonly logger = new Logger(OpenNotificationService.name);

  constructor(
    @Inject(NOTIFICATION_WRITE_REPOSITORY)
    private readonly notificationWriteRepository: INotificationWriteRepository,
    @Inject(USER_DIRECTORY_PORT)
    private readonly userDirectoryPort: IUserDirectoryPort,
    private readonly notificationBuilder: NotificationBuilder,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: OpenNotificationServiceInput): Promise<void> {
    const memberUserIds =
      await this.userDirectoryPort.listActiveMemberUserIds();
    const now = new Date();

    const created = memberUserIds.map((userId) =>
      this.notificationBuilder
        .withId(UuidValueObject.generate().value)
        .withType(input.type)
        .withReferenceType(input.referenceType)
        .withReferenceId(input.referenceId)
        .withPayload(input.payload)
        .withUserId(userId)
        .withSpaceId(input.spaceId)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build(),
    );
    created.forEach((notification) => notification.create());

    await this.notificationWriteRepository.saveMany(created);
    for (const notification of created) {
      await this.eventBus.publishAll(notification.getUncommittedEvents());
      await notification.commit();
    }

    this.logger.log(
      `Notification opened for ${input.type}:${input.referenceId} — ${created.length} recipient(s)`,
    );
  }
}

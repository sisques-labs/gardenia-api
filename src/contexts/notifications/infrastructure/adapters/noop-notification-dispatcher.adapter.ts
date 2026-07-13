import { Injectable, Logger } from '@nestjs/common';

import { INotificationDispatcherPort } from '@contexts/notifications/application/ports/notification-dispatcher.port';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';

/**
 * v1 has no push/email provider — this is the seam a future channel plugs
 * into (see notifications-module design.md's dispatcher port rationale).
 */
@Injectable()
export class NoopNotificationDispatcherAdapter implements INotificationDispatcherPort {
  private readonly logger = new Logger(NoopNotificationDispatcherAdapter.name);

  async dispatch(notification: NotificationViewModel): Promise<void> {
    this.logger.debug(
      `No-op dispatch for notification ${notification.id} (type: ${notification.type}, user: ${notification.userId})`,
    );
  }
}

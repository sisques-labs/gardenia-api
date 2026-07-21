import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PushNotificationBodyValueObject } from '@contexts/notifications/domain/value-objects/push-notification-body/push-notification-body.value-object';
import { PushNotificationTitleValueObject } from '@contexts/notifications/domain/value-objects/push-notification-title/push-notification-title.value-object';
import { PushNotificationUrlValueObject } from '@contexts/notifications/domain/value-objects/push-notification-url/push-notification-url.value-object';

export interface SendPushNotificationCommandInput {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

/**
 * Internal-only: no REST/GraphQL/MCP transport dispatches this command.
 * Its only caller is PushNotificationsProcessor (transport/queues/), which
 * consumes the push-notifications BullMQ queue.
 */
export class SendPushNotificationCommand {
  public readonly userId: UuidValueObject;
  public readonly title: PushNotificationTitleValueObject;
  public readonly body: PushNotificationBodyValueObject;
  public readonly url: PushNotificationUrlValueObject | null;

  constructor(input: SendPushNotificationCommandInput) {
    this.userId = new UuidValueObject(input.userId);
    this.title = new PushNotificationTitleValueObject(input.title);
    this.body = new PushNotificationBodyValueObject(input.body);
    this.url = input.url ? new PushNotificationUrlValueObject(input.url) : null;
  }
}

import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { SendPushNotificationCommand } from '@contexts/notifications/application/commands/send-push-notification/send-push-notification.command';

export const PUSH_NOTIFICATIONS_QUEUE = 'push-notifications';

interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

/**
 * Consumes the push-notifications BullMQ queue. This is the ONE legitimate
 * internal caller of SendPushNotificationCommand — care-schedule (or any
 * future producer) enqueues a job here instead of dispatching the command
 * directly, which is what gives delivery its retry/backoff for free.
 */
@Processor(PUSH_NOTIFICATIONS_QUEUE)
export class PushNotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(PushNotificationsProcessor.name);

  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job<PushNotificationJobData>): Promise<void> {
    this.logger.log(
      `Processing push job ${job.id} for user ${job.data.userId}`,
    );

    await this.commandBus.execute(
      new SendPushNotificationCommand({
        userId: job.data.userId,
        title: job.data.title,
        body: job.data.body,
        url: job.data.url,
      }),
    );
  }
}

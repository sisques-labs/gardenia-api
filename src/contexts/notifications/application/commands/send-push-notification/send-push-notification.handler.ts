import { Inject, Logger } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { UnregisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command';
import { PushPayload } from '@contexts/notifications/application/ports/push-payload.interface';
import {
  IPushSenderPort,
  PUSH_SENDER_PORT,
} from '@contexts/notifications/application/ports/push-sender.port';
import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { SendPushNotificationCommand } from './send-push-notification.command';

const GONE_STATUS_CODES = new Set([404, 410]);

@CommandHandler(SendPushNotificationCommand)
export class SendPushNotificationCommandHandler implements ICommandHandler<
  SendPushNotificationCommand,
  void
> {
  private readonly logger = new Logger(SendPushNotificationCommandHandler.name);

  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
    @Inject(PUSH_SENDER_PORT)
    private readonly pushSenderPort: IPushSenderPort,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: SendPushNotificationCommand): Promise<void> {
    const subscriptions =
      await this.pushSubscriptionWriteRepository.findByUserId(
        command.userId.value,
      );

    if (subscriptions.length === 0) {
      this.logger.log(
        `No push subscriptions registered for user ${command.userId.value}`,
      );
      return;
    }

    const payload: PushPayload = {
      title: command.title.value,
      body: command.body.value,
      url: command.url?.value,
    };

    for (const subscription of subscriptions) {
      await this.sendToSubscription(subscription, payload);
    }
  }

  private async sendToSubscription(
    subscription: PushSubscriptionAggregate,
    payload: PushPayload,
  ): Promise<void> {
    try {
      await this.pushSenderPort.send(subscription, payload);
    } catch (error) {
      const statusCode = (error as { statusCode?: number } | undefined)
        ?.statusCode;

      if (statusCode !== undefined && GONE_STATUS_CODES.has(statusCode)) {
        this.logger.warn(
          `Push subscription ${subscription.id.value} is gone (status ${statusCode}) — unregistering`,
        );
        await this.commandBus.execute(
          new UnregisterPushSubscriptionCommand({ id: subscription.id.value }),
        );
        return;
      }

      this.logger.error(
        `Failed to deliver push to subscription ${subscription.id.value}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

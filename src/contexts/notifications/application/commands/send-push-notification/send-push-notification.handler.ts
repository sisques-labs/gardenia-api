import { Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PushPayload } from '@contexts/notifications/application/ports/interfaces/push-payload.interface';
import { DeliverPushToSubscriptionService } from '@contexts/notifications/application/services/write/deliver-push-to-subscription/deliver-push-to-subscription.service';
import { FindPushSubscriptionsForUserService } from '@contexts/notifications/application/services/write/find-push-subscriptions-for-user/find-push-subscriptions-for-user.service';

import { SendPushNotificationCommand } from './send-push-notification.command';

@CommandHandler(SendPushNotificationCommand)
export class SendPushNotificationCommandHandler implements ICommandHandler<
  SendPushNotificationCommand,
  void
> {
  private readonly logger = new Logger(SendPushNotificationCommandHandler.name);

  constructor(
    private readonly findPushSubscriptionsForUserService: FindPushSubscriptionsForUserService,
    private readonly deliverPushToSubscriptionService: DeliverPushToSubscriptionService,
  ) {}

  async execute(command: SendPushNotificationCommand): Promise<void> {
    const subscriptions =
      await this.findPushSubscriptionsForUserService.execute(
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
      await this.deliverPushToSubscriptionService.execute({
        subscription,
        payload,
      });
    }
  }
}

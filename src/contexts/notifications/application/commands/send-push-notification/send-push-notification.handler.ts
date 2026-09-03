import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { PushPayload } from '@contexts/notifications/application/ports/interfaces/push-payload.interface';
import { AssertUserHasPushSubscriptionsService } from '@contexts/notifications/application/services/write/assert-user-has-push-subscriptions/assert-user-has-push-subscriptions.service';
import { DeliverPushToSubscriptionService } from '@contexts/notifications/application/services/write/deliver-push-to-subscription/deliver-push-to-subscription.service';

import { SendPushNotificationCommand } from './send-push-notification.command';

@CommandHandler(SendPushNotificationCommand)
export class SendPushNotificationCommandHandler implements ICommandHandler<
  SendPushNotificationCommand,
  void
> {
  constructor(
    private readonly assertUserHasPushSubscriptionsService: AssertUserHasPushSubscriptionsService,
    private readonly deliverPushToSubscriptionService: DeliverPushToSubscriptionService,
  ) {}

  async execute(command: SendPushNotificationCommand): Promise<void> {
    const subscriptions =
      await this.assertUserHasPushSubscriptionsService.execute(
        command.userId.value,
      );

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

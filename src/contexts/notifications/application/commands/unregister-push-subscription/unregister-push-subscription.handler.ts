import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertPushSubscriptionExistsService } from '@contexts/notifications/application/services/write/assert-push-subscription-exists/assert-push-subscription-exists.service';
import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { UnregisterPushSubscriptionCommand } from './unregister-push-subscription.command';

@CommandHandler(UnregisterPushSubscriptionCommand)
export class UnregisterPushSubscriptionCommandHandler
  extends BaseCommandHandler<
    UnregisterPushSubscriptionCommand,
    PushSubscriptionAggregate
  >
  implements ICommandHandler<UnregisterPushSubscriptionCommand, void>
{
  private readonly logger = new Logger(
    UnregisterPushSubscriptionCommandHandler.name,
  );

  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
    private readonly assertPushSubscriptionExistsService: AssertPushSubscriptionExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UnregisterPushSubscriptionCommand): Promise<void> {
    const subscription = await this.assertPushSubscriptionExistsService.execute(
      command.id,
    );

    subscription.delete();

    await this.pushSubscriptionWriteRepository.delete(subscription.id.value);
    await this.publishEvents(subscription);

    this.logger.log(`Push subscription unregistered: ${command.id.value}`);
  }
}

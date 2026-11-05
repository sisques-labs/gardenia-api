import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { CreatePushSubscriptionService } from '@contexts/notifications/application/services/write/create-push-subscription/create-push-subscription.service';
import { ReassignPushSubscriptionService } from '@contexts/notifications/application/services/write/reassign-push-subscription/reassign-push-subscription.service';
import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { RegisterPushSubscriptionCommand } from './register-push-subscription.command';

@CommandHandler(RegisterPushSubscriptionCommand)
export class RegisterPushSubscriptionCommandHandler
  extends BaseCommandHandler<
    RegisterPushSubscriptionCommand,
    PushSubscriptionAggregate
  >
  implements ICommandHandler<RegisterPushSubscriptionCommand, string>
{
  private readonly logger = new Logger(
    RegisterPushSubscriptionCommandHandler.name,
  );

  constructor(
    @Inject(PUSH_SUBSCRIPTION_WRITE_REPOSITORY)
    private readonly pushSubscriptionWriteRepository: IPushSubscriptionWriteRepository,
    private readonly reassignPushSubscriptionService: ReassignPushSubscriptionService,
    private readonly createPushSubscriptionService: CreatePushSubscriptionService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterPushSubscriptionCommand): Promise<string> {
    const existing = await this.pushSubscriptionWriteRepository.findByEndpoint(
      command.endpoint.value,
    );

    const subscription = existing
      ? await this.reassignPushSubscriptionService.execute({
          existing,
          userId: command.userId,
          p256dh: command.p256dh,
          auth: command.auth,
          userAgent: command.userAgent,
        })
      : await this.createPushSubscriptionService.execute({
          userId: command.userId,
          endpoint: command.endpoint,
          p256dh: command.p256dh,
          auth: command.auth,
          userAgent: command.userAgent,
        });

    await this.pushSubscriptionWriteRepository.save(subscription);
    await this.publishEvents(subscription);

    this.logger.log(
      `Push subscription registered: ${subscription.id.value} for user ${command.userId.value}`,
    );

    return subscription.id.value;
  }
}

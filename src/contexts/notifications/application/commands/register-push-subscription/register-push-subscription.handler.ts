import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
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
    private readonly pushSubscriptionBuilder: PushSubscriptionBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterPushSubscriptionCommand): Promise<string> {
    const existing = await this.pushSubscriptionWriteRepository.findByEndpoint(
      command.endpoint.value,
    );

    const subscription = existing
      ? this.reassignExisting(existing, command)
      : this.buildNew(command);

    await this.pushSubscriptionWriteRepository.save(subscription);
    await this.publishEvents(subscription);

    this.logger.log(
      `Push subscription registered: ${subscription.id.value} for user ${command.userId.value}`,
    );

    return subscription.id.value;
  }

  private reassignExisting(
    existing: PushSubscriptionAggregate,
    command: RegisterPushSubscriptionCommand,
  ): PushSubscriptionAggregate {
    existing.reassign(
      command.userId,
      command.p256dh,
      command.auth,
      command.userAgent,
    );
    return existing;
  }

  private buildNew(
    command: RegisterPushSubscriptionCommand,
  ): PushSubscriptionAggregate {
    const now = new Date();
    const subscriptionId = UuidValueObject.generate().value;

    const subscription = this.pushSubscriptionBuilder
      .withId(subscriptionId)
      .withUserId(command.userId.value)
      .withEndpoint(command.endpoint.value)
      .withP256dh(command.p256dh.value)
      .withAuth(command.auth.value)
      .withUserAgent(command.userAgent?.value ?? null)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    subscription.create();
    return subscription;
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { UnregisterPushSubscriptionCommand } from '@contexts/notifications/application/commands/unregister-push-subscription/unregister-push-subscription.command';
import { PushPayload } from '@contexts/notifications/application/ports/interfaces/push-payload.interface';
import {
  IPushSenderPort,
  PUSH_SENDER_PORT,
} from '@contexts/notifications/application/ports/push-sender.port';
import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';

const GONE_STATUS_CODES = new Set([404, 410]);

export interface DeliverPushToSubscriptionServiceInput {
  subscription: PushSubscriptionAggregate;
  payload: PushPayload;
}

/**
 * Delivers a push to a single subscription, best-effort: a 404/410 from the
 * push service unregisters the (gone) subscription; any other failure is
 * logged and swallowed so it never blocks delivery to the user's other
 * subscriptions.
 */
@Injectable()
export class DeliverPushToSubscriptionService implements IBaseService<
  DeliverPushToSubscriptionServiceInput,
  void
> {
  private readonly logger = new Logger(DeliverPushToSubscriptionService.name);

  constructor(
    @Inject(PUSH_SENDER_PORT)
    private readonly pushSenderPort: IPushSenderPort,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(input: DeliverPushToSubscriptionServiceInput): Promise<void> {
    try {
      await this.pushSenderPort.send(input.subscription, input.payload);
    } catch (error) {
      const statusCode = (error as { statusCode?: number } | undefined)
        ?.statusCode;

      if (statusCode !== undefined && GONE_STATUS_CODES.has(statusCode)) {
        this.logger.warn(
          `Push subscription ${input.subscription.id.value} is gone (status ${statusCode}) — unregistering`,
        );
        await this.commandBus.execute(
          new UnregisterPushSubscriptionCommand({
            id: input.subscription.id.value,
          }),
        );
        return;
      }

      this.logger.error(
        `Failed to deliver push to subscription ${input.subscription.id.value}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

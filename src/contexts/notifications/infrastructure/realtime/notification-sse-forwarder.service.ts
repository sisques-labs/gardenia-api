import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventBus, IEvent } from '@nestjs/cqrs';
import { Subscription } from 'rxjs';

import {
  isNotificationDomainEvent,
  toSseMessageEvent,
} from '@contexts/notifications/infrastructure/realtime/notification-sse-event.mapper';
import { NotificationSseConnectionRegistry } from '@contexts/notifications/infrastructure/realtime/notification-sse-connection.registry';

/**
 * Subscribes to the shared in-process EventBus — every domain event the
 * NotificationAggregate applies flows through it already, SSE or not — and
 * forwards the three notification event types to any open connection for
 * their recipient. Mirrors DomainEventForwarderService's
 * OnModuleInit/eventBus.subscribe() shape (the existing Kafka forwarder),
 * just with a different sink.
 */
@Injectable()
export class NotificationSseForwarderService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationSseForwarderService.name);
  private subscription?: Subscription;

  constructor(
    private readonly eventBus: EventBus,
    private readonly registry: NotificationSseConnectionRegistry,
  ) {}

  onModuleInit(): void {
    this.subscription = this.eventBus.subscribe((event: IEvent) => {
      if (!isNotificationDomainEvent(event)) return;

      const { userId, spaceId } = event.data;
      if (!userId || !spaceId) {
        this.logger.warn(
          `Notification event ${event.constructor.name} missing userId/spaceId — cannot forward`,
        );
        return;
      }

      this.registry.publish(userId, spaceId, toSseMessageEvent(event));
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

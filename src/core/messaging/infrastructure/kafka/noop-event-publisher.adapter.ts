import { IOutboundEvent } from '@core/messaging/domain/interfaces/outbound-event.interface';
import { IEventPublisher } from '@core/messaging/domain/ports/event-publisher.port';
import { Injectable } from '@nestjs/common';

/**
 * No-op publisher used when Kafka forwarding is disabled (`KAFKA_ENABLED!=true`).
 * Keeps the DI graph valid without opening a broker connection. The forwarder
 * never subscribes when disabled, so `publish` is effectively unreachable, but it
 * is provided so `EVENT_PUBLISHER` always resolves.
 */
@Injectable()
export class NoopEventPublisherAdapter implements IEventPublisher {
  async publish(_event: IOutboundEvent): Promise<void> {
    // intentionally no-op
  }
}

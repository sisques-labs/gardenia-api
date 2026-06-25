import { IKafkaConfig } from '@core/config/kafka.config';
import { DomainEventForwarderService } from '@core/messaging/application/services/domain-event-forwarder.service';
import {
  EVENT_PUBLISHER,
  IEventPublisher,
} from '@core/messaging/domain/ports/event-publisher.port';
import { KafkajsEventPublisherAdapter } from '@core/messaging/infrastructure/kafka/kafkajs-event-publisher.adapter';
import { NoopEventPublisherAdapter } from '@core/messaging/infrastructure/kafka/noop-event-publisher.adapter';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

/**
 * Bridges the in-process `@nestjs/cqrs` `EventBus` to Kafka. `DomainEventForwarderService`
 * subscribes to every published domain event and republishes it through the
 * `EVENT_PUBLISHER` port, in addition to in-process delivery.
 *
 * The port resolves to the kafkajs adapter when `KAFKA_ENABLED=true`, otherwise to
 * a no-op — so no broker is required to boot locally or in tests. Topics are
 * `${KAFKA_TOPIC_PREFIX}.${module}` (e.g. `gardenia-api.plants`); the action lives
 * in the `event-type` header.
 */
@Module({
  imports: [CqrsModule],
  providers: [
    DomainEventForwarderService,
    {
      provide: EVENT_PUBLISHER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): IEventPublisher => {
        const enabled =
          configService.get<IKafkaConfig>('kafka')?.enabled ?? false;
        return enabled
          ? new KafkajsEventPublisherAdapter(configService)
          : new NoopEventPublisherAdapter();
      },
    },
  ],
})
export class MessagingModule {}

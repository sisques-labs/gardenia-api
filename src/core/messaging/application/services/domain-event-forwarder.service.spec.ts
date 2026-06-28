import { ConfigService } from '@nestjs/config';
import { EventBus, IEvent } from '@nestjs/cqrs';

import { IEventPublisher } from '@core/messaging/domain/ports/event-publisher.port';

import { DomainEventForwarderService } from './domain-event-forwarder.service';

function makeDomainEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    eventId: 'evt-1',
    eventType: 'PlantUpdatedEvent',
    aggregateRootId: 'plant-1',
    aggregateRootType: 'PlantAggregate',
    entityId: 'plant-1',
    entityType: 'PlantAggregate',
    schemaVersion: '1',
    ocurredAt: new Date('2026-06-25T00:00:00.000Z'),
    correlationId: null,
    causationId: null,
    data: { id: 'plant-1', name: 'Rose' },
    ...overrides,
  } as unknown as IEvent;
}

describe('DomainEventForwarderService', () => {
  let eventBus: jest.Mocked<EventBus>;
  let configService: jest.Mocked<ConfigService>;
  let publisher: jest.Mocked<IEventPublisher>;
  let service: DomainEventForwarderService;
  let capturedHandler: ((event: IEvent) => void) | undefined;
  const unsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedHandler = undefined;

    eventBus = {
      subscribe: jest.fn((handler: (event: IEvent) => void) => {
        capturedHandler = handler;
        return { unsubscribe } as never;
      }),
    } as unknown as jest.Mocked<EventBus>;

    configService = {
      get: jest.fn().mockReturnValue({ enabled: true }),
    } as unknown as jest.Mocked<ConfigService>;

    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IEventPublisher>;

    service = new DomainEventForwarderService(
      eventBus,
      configService,
      publisher,
    );
  });

  describe('when Kafka is disabled', () => {
    it('does not subscribe to the EventBus', () => {
      configService.get.mockReturnValue({ enabled: false });

      service.onModuleInit();

      expect(eventBus.subscribe).not.toHaveBeenCalled();
    });
  });

  describe('when Kafka is enabled', () => {
    beforeEach(() => {
      service.onModuleInit();
    });

    it('subscribes to the EventBus', () => {
      expect(eventBus.subscribe).toHaveBeenCalledTimes(1);
    });

    it('forwards a domain event as a normalized outbound event', async () => {
      capturedHandler?.(makeDomainEvent());
      await Promise.resolve();

      expect(publisher.publish).toHaveBeenCalledTimes(1);
      expect(publisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          module: 'plants',
          action: 'plant-updated',
          eventType: 'PlantUpdatedEvent',
          eventId: 'evt-1',
          aggregateRootId: 'plant-1',
          aggregateRootType: 'PlantAggregate',
          occurredAt: new Date('2026-06-25T00:00:00.000Z'),
          data: { id: 'plant-1', name: 'Rose' },
        }),
      );
    });

    it('routes an unmapped aggregate to the unmapped module and warns once', async () => {
      const warn = jest
        .spyOn(service['logger'], 'warn')
        .mockImplementation(() => undefined);

      capturedHandler?.(
        makeDomainEvent({ aggregateRootType: 'MysteryAggregate' }),
      );
      capturedHandler?.(
        makeDomainEvent({ aggregateRootType: 'MysteryAggregate' }),
      );
      await Promise.resolve();

      expect(publisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({ module: 'unmapped' }),
      );
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it('ignores non-domain events (no metadata fields)', async () => {
      capturedHandler?.({ foo: 'bar' } as unknown as IEvent);
      await Promise.resolve();

      expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('swallows publish failures (best-effort)', async () => {
      const error = jest
        .spyOn(service['logger'], 'error')
        .mockImplementation(() => undefined);
      publisher.publish.mockRejectedValueOnce(new Error('broker down'));

      expect(() => capturedHandler?.(makeDomainEvent())).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();

      expect(error).toHaveBeenCalledTimes(1);
    });
  });

  it('unsubscribes on destroy', () => {
    service.onModuleInit();

    service.onModuleDestroy();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

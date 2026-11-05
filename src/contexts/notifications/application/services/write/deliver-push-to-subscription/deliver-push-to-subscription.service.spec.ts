import { CommandBus } from '@nestjs/cqrs';

import { IPushSenderPort } from '@contexts/notifications/application/ports/push-sender.port';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';

import { DeliverPushToSubscriptionService } from './deliver-push-to-subscription.service';

const PAYLOAD = { title: 'Time to water', body: 'watering is due' };

function buildSubscription() {
  return new PushSubscriptionBuilder()
    .withId('550e8400-e29b-41d4-a716-446655440000')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
    .withP256dh('p256dh-key')
    .withAuth('auth-secret')
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .build();
}

describe('DeliverPushToSubscriptionService', () => {
  let service: DeliverPushToSubscriptionService;
  let mockSenderPort: jest.Mocked<IPushSenderPort>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockSenderPort = { send: jest.fn() } as jest.Mocked<IPushSenderPort>;
    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    service = new DeliverPushToSubscriptionService(
      mockSenderPort,
      mockCommandBus,
    );
  });

  it('sends the payload via the sender port', async () => {
    const subscription = buildSubscription();

    await service.execute({ subscription, payload: PAYLOAD });

    expect(mockSenderPort.send).toHaveBeenCalledWith(subscription, PAYLOAD);
  });

  it('swallows a non-gone error without unregistering', async () => {
    mockSenderPort.send.mockRejectedValue(new Error('temporary failure'));

    await expect(
      service.execute({ subscription: buildSubscription(), payload: PAYLOAD }),
    ).resolves.not.toThrow();
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('unregisters the subscription on a 410 (gone) error', async () => {
    const subscription = buildSubscription();
    mockSenderPort.send.mockRejectedValue(
      Object.assign(new Error('gone'), { statusCode: 410 }),
    );

    await service.execute({ subscription, payload: PAYLOAD });

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = mockCommandBus.execute.mock.calls[0][0] as {
      id: { value: string };
    };
    expect(dispatched.id.value).toBe(subscription.id.value);
  });

  it('unregisters the subscription on a 404 (gone) error', async () => {
    const subscription = buildSubscription();
    mockSenderPort.send.mockRejectedValue(
      Object.assign(new Error('not found'), { statusCode: 404 }),
    );

    await service.execute({ subscription, payload: PAYLOAD });

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });
});

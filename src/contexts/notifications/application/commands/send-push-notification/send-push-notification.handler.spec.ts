import { CommandBus } from '@nestjs/cqrs';

import { IPushSenderPort } from '@contexts/notifications/application/ports/push-sender.port';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { SendPushNotificationCommand } from './send-push-notification.command';
import { SendPushNotificationCommandHandler } from './send-push-notification.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

function buildSubscription(id: string) {
  return new PushSubscriptionBuilder()
    .withId(id)
    .withUserId(USER_ID)
    .withEndpoint(`https://fcm.googleapis.com/fcm/send/${id}`)
    .withP256dh('p256dh-key')
    .withAuth('auth-secret')
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .build();
}

describe('SendPushNotificationCommandHandler', () => {
  let handler: SendPushNotificationCommandHandler;
  let mockWriteRepo: jest.Mocked<IPushSubscriptionWriteRepository>;
  let mockSenderPort: jest.Mocked<IPushSenderPort>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      findByEndpoint: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<IPushSubscriptionWriteRepository>;

    mockSenderPort = {
      send: jest.fn(),
    } as jest.Mocked<IPushSenderPort>;

    mockCommandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    handler = new SendPushNotificationCommandHandler(
      mockWriteRepo,
      mockSenderPort,
      mockCommandBus,
    );
  });

  it('is a no-op when the user has no subscriptions', async () => {
    mockWriteRepo.findByUserId.mockResolvedValue([]);

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockSenderPort.send).not.toHaveBeenCalled();
  });

  it('attempts delivery to every subscription, even if one throws', async () => {
    const a = buildSubscription('550e8400-e29b-41d4-a716-446655440000');
    const b = buildSubscription('550e8400-e29b-41d4-a716-446655440099');
    mockWriteRepo.findByUserId.mockResolvedValue([a, b]);
    mockSenderPort.send.mockImplementation((subscription) => {
      if (subscription.id.value === a.id.value) {
        return Promise.reject(new Error('network error'));
      }
      return Promise.resolve();
    });

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockSenderPort.send).toHaveBeenCalledTimes(2);
  });

  it('unregisters a subscription when delivery fails with a 410 status', async () => {
    const gone = buildSubscription('550e8400-e29b-41d4-a716-446655440000');
    mockWriteRepo.findByUserId.mockResolvedValue([gone]);
    const error = Object.assign(new Error('gone'), { statusCode: 410 });
    mockSenderPort.send.mockRejectedValue(error);

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = mockCommandBus.execute.mock.calls[0][0] as {
      id: { value: string };
    };
    expect(dispatched.id.value).toBe(gone.id.value);
  });

  it('does not unregister on a non-gone error', async () => {
    const subscription = buildSubscription(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    mockWriteRepo.findByUserId.mockResolvedValue([subscription]);
    mockSenderPort.send.mockRejectedValue(new Error('temporary failure'));

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});

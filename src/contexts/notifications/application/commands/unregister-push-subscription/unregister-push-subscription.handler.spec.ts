import { EventBus } from '@nestjs/cqrs';

import { AssertPushSubscriptionExistsService } from '@contexts/notifications/application/services/write/assert-push-subscription-exists/assert-push-subscription-exists.service';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PushSubscriptionNotFoundException } from '@contexts/notifications/domain/exceptions/push-subscription-not-found.exception';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { UnregisterPushSubscriptionCommand } from './unregister-push-subscription.command';
import { UnregisterPushSubscriptionCommandHandler } from './unregister-push-subscription.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('UnregisterPushSubscriptionCommandHandler', () => {
  let handler: UnregisterPushSubscriptionCommandHandler;
  let mockWriteRepo: jest.Mocked<IPushSubscriptionWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAssert: jest.Mocked<AssertPushSubscriptionExistsService>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      findByEndpoint: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<IPushSubscriptionWriteRepository>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    mockAssert = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPushSubscriptionExistsService>;

    handler = new UnregisterPushSubscriptionCommandHandler(
      mockWriteRepo,
      mockAssert,
      mockEventBus,
    );
  });

  it('deletes the subscription and publishes the event', async () => {
    const subscription = new PushSubscriptionBuilder()
      .withId(ID)
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
      .withP256dh('p256dh-key')
      .withAuth('auth-secret')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    mockAssert.execute.mockResolvedValue(subscription);

    await handler.execute(new UnregisterPushSubscriptionCommand({ id: ID }));

    expect(mockWriteRepo.delete).toHaveBeenCalledWith(ID);
  });

  it('propagates not-found from the assert service', async () => {
    mockAssert.execute.mockRejectedValue(
      new PushSubscriptionNotFoundException(ID),
    );

    await expect(
      handler.execute(new UnregisterPushSubscriptionCommand({ id: ID })),
    ).rejects.toThrow(PushSubscriptionNotFoundException);
    expect(mockWriteRepo.delete).not.toHaveBeenCalled();
  });
});

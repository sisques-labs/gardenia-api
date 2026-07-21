import { EventBus } from '@nestjs/cqrs';

import { CreatePushSubscriptionService } from '@contexts/notifications/application/services/write/create-push-subscription/create-push-subscription.service';
import { ReassignPushSubscriptionService } from '@contexts/notifications/application/services/write/reassign-push-subscription/reassign-push-subscription.service';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { RegisterPushSubscriptionCommand } from './register-push-subscription.command';
import { RegisterPushSubscriptionCommandHandler } from './register-push-subscription.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';

describe('RegisterPushSubscriptionCommandHandler', () => {
  let handler: RegisterPushSubscriptionCommandHandler;
  let mockWriteRepo: jest.Mocked<IPushSubscriptionWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
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

    handler = new RegisterPushSubscriptionCommandHandler(
      mockWriteRepo,
      new ReassignPushSubscriptionService(),
      new CreatePushSubscriptionService(new PushSubscriptionBuilder()),
      mockEventBus,
    );
  });

  it('creates a new subscription when the endpoint is not registered', async () => {
    mockWriteRepo.findByEndpoint.mockResolvedValue(null);

    const id = await handler.execute(
      new RegisterPushSubscriptionCommand({
        userId: USER_ID,
        endpoint: ENDPOINT,
        p256dh: 'p256dh-key',
        auth: 'auth-secret',
      }),
    );

    expect(id).toBeTruthy();
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('reassigns an existing subscription found by endpoint, without creating a new one', async () => {
    const existing = new PushSubscriptionBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('770e8400-e29b-41d4-a716-446655440002')
      .withEndpoint(ENDPOINT)
      .withP256dh('old-p256dh')
      .withAuth('old-auth')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    mockWriteRepo.findByEndpoint.mockResolvedValue(existing);

    const id = await handler.execute(
      new RegisterPushSubscriptionCommand({
        userId: USER_ID,
        endpoint: ENDPOINT,
        p256dh: 'new-p256dh',
        auth: 'new-auth',
      }),
    );

    expect(id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(existing.userId.value).toBe(USER_ID);
    expect(existing.p256dh.value).toBe('new-p256dh');
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(mockWriteRepo.save).toHaveBeenCalledWith(existing);
  });
});

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { FindPushSubscriptionsForUserService } from './find-push-subscriptions-for-user.service';

describe('FindPushSubscriptionsForUserService', () => {
  let service: FindPushSubscriptionsForUserService;
  let mockWriteRepo: jest.Mocked<IPushSubscriptionWriteRepository>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      findByEndpoint: jest.fn(),
      findByUserId: jest.fn(),
    } as jest.Mocked<IPushSubscriptionWriteRepository>;

    service = new FindPushSubscriptionsForUserService(mockWriteRepo);
  });

  it('delegates to the write repository', async () => {
    const subscription = new PushSubscriptionBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
      .withP256dh('p256dh-key')
      .withAuth('auth-secret')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    mockWriteRepo.findByUserId.mockResolvedValue([subscription]);

    const result = await service.execute(
      '660e8400-e29b-41d4-a716-446655440001',
    );

    expect(result).toEqual([subscription]);
    expect(mockWriteRepo.findByUserId).toHaveBeenCalledWith(
      '660e8400-e29b-41d4-a716-446655440001',
    );
  });

  it('returns an empty array when the user has no subscriptions', async () => {
    mockWriteRepo.findByUserId.mockResolvedValue([]);

    const result = await service.execute(
      '660e8400-e29b-41d4-a716-446655440001',
    );

    expect(result).toEqual([]);
  });
});

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { NoPushSubscriptionsForUserException } from '@contexts/notifications/domain/exceptions/no-push-subscriptions-for-user.exception';
import { IPushSubscriptionWriteRepository } from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import { AssertUserHasPushSubscriptionsService } from './assert-user-has-push-subscriptions.service';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('AssertUserHasPushSubscriptionsService', () => {
  let service: AssertUserHasPushSubscriptionsService;
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

    service = new AssertUserHasPushSubscriptionsService(mockWriteRepo);
  });

  it('returns the subscriptions when the user has at least one', async () => {
    const subscription = new PushSubscriptionBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId(USER_ID)
      .withEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
      .withP256dh('p256dh-key')
      .withAuth('auth-secret')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    mockWriteRepo.findByUserId.mockResolvedValue([subscription]);

    const result = await service.execute(USER_ID);

    expect(result).toEqual([subscription]);
    expect(mockWriteRepo.findByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('throws NoPushSubscriptionsForUserException when the user has none', async () => {
    mockWriteRepo.findByUserId.mockResolvedValue([]);

    await expect(service.execute(USER_ID)).rejects.toThrow(
      NoPushSubscriptionsForUserException,
    );
  });
});

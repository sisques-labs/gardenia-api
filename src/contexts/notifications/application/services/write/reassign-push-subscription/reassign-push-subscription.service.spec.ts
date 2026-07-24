import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

import { ReassignPushSubscriptionService } from './reassign-push-subscription.service';

describe('ReassignPushSubscriptionService', () => {
  it('reassigns userId, keys, and userAgent on the existing aggregate', async () => {
    const service = new ReassignPushSubscriptionService();
    const existing = new PushSubscriptionBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withUserId('660e8400-e29b-41d4-a716-446655440001')
      .withEndpoint('https://fcm.googleapis.com/fcm/send/abc123')
      .withP256dh('old-p256dh')
      .withAuth('old-auth')
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();

    const newUserId = new UuidValueObject(
      '770e8400-e29b-41d4-a716-446655440002',
    );
    const result = await service.execute({
      existing,
      userId: newUserId,
      p256dh: new PushSubscriptionP256dhValueObject('new-p256dh'),
      auth: new PushSubscriptionAuthValueObject('new-auth'),
      userAgent: null,
    });

    expect(result).toBe(existing);
    expect(result.userId.value).toBe(newUserId.value);
    expect(result.p256dh.value).toBe('new-p256dh');
    expect(result.auth.value).toBe('new-auth');
  });
});

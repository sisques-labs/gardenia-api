import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PushSubscriptionAuthValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-auth/push-subscription-auth.value-object';
import { PushSubscriptionEndpointValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-endpoint/push-subscription-endpoint.value-object';
import { PushSubscriptionP256dhValueObject } from '@contexts/notifications/domain/value-objects/push-subscription-p256dh/push-subscription-p256dh.value-object';

import { CreatePushSubscriptionService } from './create-push-subscription.service';

describe('CreatePushSubscriptionService', () => {
  it('builds and creates a new subscription', async () => {
    const service = new CreatePushSubscriptionService(
      new PushSubscriptionBuilder(),
    );

    const subscription = await service.execute({
      userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
      endpoint: new PushSubscriptionEndpointValueObject(
        'https://fcm.googleapis.com/fcm/send/abc123',
      ),
      p256dh: new PushSubscriptionP256dhValueObject('p256dh-key'),
      auth: new PushSubscriptionAuthValueObject('auth-secret'),
      userAgent: null,
    });

    expect(subscription.userId.value).toBe(
      '660e8400-e29b-41d4-a716-446655440001',
    );
    expect(subscription.endpoint.value).toBe(
      'https://fcm.googleapis.com/fcm/send/abc123',
    );
    expect(subscription.getUncommittedEvents()).toHaveLength(1);
  });
});

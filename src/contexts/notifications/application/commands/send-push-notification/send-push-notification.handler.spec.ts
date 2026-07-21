import { DeliverPushToSubscriptionService } from '@contexts/notifications/application/services/write/deliver-push-to-subscription/deliver-push-to-subscription.service';
import { FindPushSubscriptionsForUserService } from '@contexts/notifications/application/services/write/find-push-subscriptions-for-user/find-push-subscriptions-for-user.service';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';

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
  let mockFindService: jest.Mocked<FindPushSubscriptionsForUserService>;
  let mockDeliverService: jest.Mocked<DeliverPushToSubscriptionService>;

  beforeEach(() => {
    mockFindService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<FindPushSubscriptionsForUserService>;

    mockDeliverService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DeliverPushToSubscriptionService>;

    handler = new SendPushNotificationCommandHandler(
      mockFindService,
      mockDeliverService,
    );
  });

  it('is a no-op when the user has no subscriptions', async () => {
    mockFindService.execute.mockResolvedValue([]);

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockDeliverService.execute).not.toHaveBeenCalled();
  });

  it('delivers to every subscription returned', async () => {
    const a = buildSubscription('550e8400-e29b-41d4-a716-446655440000');
    const b = buildSubscription('550e8400-e29b-41d4-a716-446655440099');
    mockFindService.execute.mockResolvedValue([a, b]);

    await handler.execute(
      new SendPushNotificationCommand({
        userId: USER_ID,
        title: 'Time to water',
        body: 'watering is due',
      }),
    );

    expect(mockDeliverService.execute).toHaveBeenCalledTimes(2);
    expect(mockDeliverService.execute).toHaveBeenNthCalledWith(1, {
      subscription: a,
      payload: {
        title: 'Time to water',
        body: 'watering is due',
        url: undefined,
      },
    });
  });
});

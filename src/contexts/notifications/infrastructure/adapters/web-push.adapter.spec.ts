import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';

import { WebPushAdapter } from './web-push.adapter';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

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

describe('WebPushAdapter', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          WEB_PUSH_VAPID_SUBJECT: 'mailto:test@example.com',
          WEB_PUSH_VAPID_PUBLIC_KEY: 'public-key',
          WEB_PUSH_VAPID_PRIVATE_KEY: 'private-key',
        };
        return values[key];
      }),
    } as unknown as jest.Mocked<ConfigService>;
  });

  it('configures VAPID details on construction', () => {
    new WebPushAdapter(mockConfigService);

    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:test@example.com',
      'public-key',
      'private-key',
    );
  });

  it('sends the payload to the subscription endpoint with its keys', async () => {
    const adapter = new WebPushAdapter(mockConfigService);
    const subscription = buildSubscription();

    await adapter.send(subscription, {
      title: 'Time to water your plant',
      body: 'watering is due',
      url: '/plants/770e8400-e29b-41d4-a716-446655440002',
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
        keys: { p256dh: 'p256dh-key', auth: 'auth-secret' },
      },
      JSON.stringify({
        title: 'Time to water your plant',
        body: 'watering is due',
        url: '/plants/770e8400-e29b-41d4-a716-446655440002',
      }),
    );
  });

  it('propagates errors from web-push (e.g. WebPushError with statusCode)', async () => {
    const adapter = new WebPushAdapter(mockConfigService);
    const error = Object.assign(new Error('gone'), { statusCode: 410 });
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await expect(
      adapter.send(buildSubscription(), { title: 't', body: 'b' }),
    ).rejects.toThrow('gone');
  });
});

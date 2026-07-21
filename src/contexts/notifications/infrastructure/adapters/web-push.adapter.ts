import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

import { IPushSenderPort } from '@contexts/notifications/application/ports/push-sender.port';
import { PushPayload } from '@contexts/notifications/application/ports/interfaces/push-payload.interface';
import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';

@Injectable()
export class WebPushAdapter implements IPushSenderPort {
  private readonly logger = new Logger(WebPushAdapter.name);

  constructor(private readonly configService: ConfigService) {
    webpush.setVapidDetails(
      this.configService.getOrThrow<string>('WEB_PUSH_VAPID_SUBJECT'),
      this.configService.getOrThrow<string>('WEB_PUSH_VAPID_PUBLIC_KEY'),
      this.configService.getOrThrow<string>('WEB_PUSH_VAPID_PRIVATE_KEY'),
    );
  }

  async send(
    subscription: PushSubscriptionAggregate,
    payload: PushPayload,
  ): Promise<void> {
    this.logger.log(
      `Sending push notification to subscription ${subscription.id.value}`,
    );

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint.value,
        keys: {
          p256dh: subscription.p256dh.value,
          auth: subscription.auth.value,
        },
      },
      JSON.stringify(payload),
    );
  }
}

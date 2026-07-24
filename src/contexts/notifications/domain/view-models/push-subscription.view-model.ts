import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPushSubscriptionPrimitives } from '@contexts/notifications/domain/primitives/push-subscription.primitives';

export class PushSubscriptionViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly endpoint: string;
  public readonly p256dh: string;
  public readonly auth: string;
  public readonly userAgent: string | null;

  constructor(props: IPushSubscriptionPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.endpoint = props.endpoint;
    this.p256dh = props.p256dh;
    this.auth = props.auth;
    this.userAgent = props.userAgent;
  }
}

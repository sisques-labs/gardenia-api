import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { INotificationPrimitives } from '@contexts/notifications/domain/primitives/notification.primitives';

export class NotificationViewModel extends BaseViewModel {
  public readonly type: string;
  public readonly referenceType: string;
  public readonly referenceId: string;
  public readonly dedupeKey: string;
  public readonly payload: Record<string, unknown>;
  public readonly status: string;
  public readonly readAt: Date | null;
  public readonly resolvedAt: Date | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: INotificationPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.type = props.type;
    this.referenceType = props.referenceType;
    this.referenceId = props.referenceId;
    this.dedupeKey = props.dedupeKey;
    this.payload = props.payload;
    this.status = props.status;
    this.readAt = props.readAt;
    this.resolvedAt = props.resolvedAt;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}

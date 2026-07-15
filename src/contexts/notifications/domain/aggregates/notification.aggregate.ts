import {
  BaseAggregate,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { NotificationDedupeKeyMismatchException } from '@contexts/notifications/domain/exceptions/notification-dedupe-key-mismatch.exception';
import { NotificationCreatedEvent } from '@contexts/notifications/domain/events/notification-created/notification-created.event';
import { NotificationReadEvent } from '@contexts/notifications/domain/events/notification-read/notification-read.event';
import { NotificationResolvedEvent } from '@contexts/notifications/domain/events/notification-resolved/notification-resolved.event';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { INotification } from '@contexts/notifications/domain/interfaces/notification.interface';
import { INotificationPrimitives } from '@contexts/notifications/domain/primitives/notification.primitives';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';

export class NotificationAggregate extends BaseAggregate {
  private readonly _id: NotificationIdValueObject;
  private readonly _type: NotificationTypeValueObject;
  private readonly _referenceType: NotificationReferenceTypeValueObject;
  private readonly _referenceId: UuidValueObject;
  private readonly _dedupeKey: NotificationDedupeKeyValueObject;
  private readonly _payload: NotificationPayloadValueObject;
  private _status: NotificationStatusValueObject;
  private _readAt: DateValueObject | null;
  private _resolvedAt: DateValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: INotification) {
    super(props.createdAt, props.updatedAt);

    const expectedDedupeKey = NotificationDedupeKeyValueObject.compute(
      props.type.value,
      props.referenceId.value,
    );
    if (props.dedupeKey.value !== expectedDedupeKey) {
      throw new NotificationDedupeKeyMismatchException(
        props.dedupeKey.value,
        expectedDedupeKey,
      );
    }

    this._id = props.id;
    this._type = props.type;
    this._referenceType = props.referenceType;
    this._referenceId = props.referenceId;
    this._dedupeKey = props.dedupeKey;
    this._payload = props.payload;
    this._status = props.status;
    this._readAt = props.readAt;
    this._resolvedAt = props.resolvedAt;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new NotificationCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NotificationAggregate.name,
          entityId: this._id.value,
          entityType: NotificationAggregate.name,
          eventType: NotificationCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public markRead(): void {
    if (this._status.value === NotificationStatusEnum.READ) return;
    this._status = new NotificationStatusValueObject(
      NotificationStatusEnum.READ,
    );
    this._readAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new NotificationReadEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NotificationAggregate.name,
          entityId: this._id.value,
          entityType: NotificationAggregate.name,
          eventType: NotificationReadEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public resolve(): void {
    if (this._resolvedAt !== null) return;
    this._resolvedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new NotificationResolvedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: NotificationAggregate.name,
          entityId: this._id.value,
          entityType: NotificationAggregate.name,
          eventType: NotificationResolvedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public toPrimitives(): INotificationPrimitives {
    return {
      id: this._id.value,
      type: this._type.value,
      referenceType: this._referenceType.value,
      referenceId: this._referenceId.value,
      dedupeKey: this._dedupeKey.value,
      payload: this._payload.value,
      status: this._status.value,
      readAt: this._readAt?.value ?? null,
      resolvedAt: this._resolvedAt?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): NotificationIdValueObject {
    return this._id;
  }
  get type(): NotificationTypeValueObject {
    return this._type;
  }
  get referenceType(): NotificationReferenceTypeValueObject {
    return this._referenceType;
  }
  get referenceId(): UuidValueObject {
    return this._referenceId;
  }
  get dedupeKey(): NotificationDedupeKeyValueObject {
    return this._dedupeKey;
  }
  get payload(): NotificationPayloadValueObject {
    return this._payload;
  }
  get status(): NotificationStatusValueObject {
    return this._status;
  }
  get readAt(): DateValueObject | null {
    return this._readAt;
  }
  get resolvedAt(): DateValueObject | null {
    return this._resolvedAt;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}

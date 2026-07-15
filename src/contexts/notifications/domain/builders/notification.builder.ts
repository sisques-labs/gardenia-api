import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationStatusEnum } from '@contexts/notifications/domain/enums/notification-status.enum';
import { NotificationDedupeKeyValueObject } from '@contexts/notifications/domain/value-objects/notification-dedupe-key/notification-dedupe-key.value-object';
import { NotificationIdValueObject } from '@contexts/notifications/domain/value-objects/notification-id/notification-id.value-object';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationStatusValueObject } from '@contexts/notifications/domain/value-objects/notification-status/notification-status.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';

@Injectable()
export class NotificationBuilder extends BaseBuilder<
  NotificationAggregate,
  NotificationViewModel
> {
  private _type!: string;
  private _referenceType!: string;
  private _referenceId!: string;
  private _payload: Record<string, unknown> = {};
  private _status: string = NotificationStatusEnum.UNREAD;
  private _readAt: Date | null = null;
  private _resolvedAt: Date | null = null;
  private _userId!: string;
  private _spaceId!: string;

  withType(type: string): this {
    this._type = type;
    return this;
  }

  withReferenceType(referenceType: string): this {
    this._referenceType = referenceType;
    return this;
  }

  withReferenceId(referenceId: string): this {
    this._referenceId = referenceId;
    return this;
  }

  withPayload(payload: Record<string, unknown>): this {
    this._payload = payload;
    return this;
  }

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withReadAt(readAt: Date | null): this {
    this._readAt = readAt;
    return this;
  }

  withResolvedAt(resolvedAt: Date | null): this {
    this._resolvedAt = resolvedAt;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  public override build(): NotificationAggregate {
    this.validate();
    const dedupeKey = NotificationDedupeKeyValueObject.compute(
      this._type,
      this._referenceId,
    );
    return new NotificationAggregate({
      id: new NotificationIdValueObject(this._id),
      type: new NotificationTypeValueObject(this._type),
      referenceType: new NotificationReferenceTypeValueObject(
        this._referenceType,
      ),
      referenceId: new UuidValueObject(this._referenceId),
      dedupeKey: new NotificationDedupeKeyValueObject(dedupeKey),
      payload: new NotificationPayloadValueObject(this._payload),
      status: new NotificationStatusValueObject(
        this._status as NotificationStatusEnum,
      ),
      readAt: this._readAt ? new DateValueObject(this._readAt) : null,
      resolvedAt: this._resolvedAt
        ? new DateValueObject(this._resolvedAt)
        : null,
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): NotificationViewModel {
    this.validate();
    return new NotificationViewModel({
      id: this._id,
      type: this._type,
      referenceType: this._referenceType,
      referenceId: this._referenceId,
      dedupeKey: NotificationDedupeKeyValueObject.compute(
        this._type,
        this._referenceId,
      ),
      payload: this._payload,
      status: this._status,
      readAt: this._readAt,
      resolvedAt: this._resolvedAt,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._type) throw new FieldIsRequiredException('type');
    if (!this._referenceType)
      throw new FieldIsRequiredException('referenceType');
    if (!this._referenceId) throw new FieldIsRequiredException('referenceId');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}

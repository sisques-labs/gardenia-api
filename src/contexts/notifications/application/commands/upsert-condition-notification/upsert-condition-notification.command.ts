import { BooleanValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { INotificationPrimitives } from '@contexts/notifications/domain/primitives/notification.primitives';
import { NotificationPayloadValueObject } from '@contexts/notifications/domain/value-objects/notification-payload/notification-payload.value-object';
import { NotificationReferenceTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-reference-type/notification-reference-type.value-object';
import { NotificationTypeValueObject } from '@contexts/notifications/domain/value-objects/notification-type/notification-type.value-object';

export type UpsertConditionNotificationCommandInput = Pick<
  INotificationPrimitives,
  'type' | 'referenceType' | 'referenceId' | 'payload'
> & {
  active: boolean;
};

/**
 * Internal command — no direct REST/GraphQL/MCP surface. Dispatched by the
 * bounded context that owns a notifiable condition (care-schedule, inventory,
 * ...) whenever a mutation or its own periodic sweep determines the
 * condition's current true/false state. Idempotent both ways: dispatching
 * active:true while already open, or active:false while already
 * resolved/never created, is a no-op.
 */
export class UpsertConditionNotificationCommand {
  public readonly type: NotificationTypeValueObject;
  public readonly referenceType: NotificationReferenceTypeValueObject;
  public readonly referenceId: UuidValueObject;
  public readonly payload: NotificationPayloadValueObject;
  public readonly active: BooleanValueObject;

  constructor(input: UpsertConditionNotificationCommandInput) {
    this.type = new NotificationTypeValueObject(input.type);
    this.referenceType = new NotificationReferenceTypeValueObject(
      input.referenceType,
    );
    this.referenceId = new UuidValueObject(input.referenceId);
    this.payload = new NotificationPayloadValueObject(input.payload);
    this.active = new BooleanValueObject(input.active);
  }
}

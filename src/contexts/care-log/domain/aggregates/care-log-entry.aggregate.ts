import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogEntryCreatedEvent } from '@contexts/care-log/domain/events/care-log-entry-created/care-log-entry-created.event';
import { CareLogEntryUpdatedEvent } from '@contexts/care-log/domain/events/care-log-entry-updated/care-log-entry-updated.event';
import { CareLogEntryDeletedEvent } from '@contexts/care-log/domain/events/care-log-entry-deleted/care-log-entry-deleted.event';
import { CareLogQuantityUnitMismatchException } from '@contexts/care-log/domain/exceptions/care-log-quantity-unit-mismatch.exception';
import { ICareLogEntry } from '@contexts/care-log/domain/interfaces/care-log-entry.interface';
import { ICareLogEntryPrimitives } from '@contexts/care-log/domain/primitives/care-log-entry.primitives';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { CareLogNotesValueObject } from '@contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object';
import { CareLogQuantityValueObject } from '@contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

export class CareLogEntryAggregate extends BaseAggregate {
  private readonly _id: CareLogIdValueObject;
  private readonly _plantId: UuidValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private _activityType: CareLogActivityTypeValueObject;
  private _performedAt: CareLogPerformedAtValueObject;
  private _notes: CareLogNotesValueObject | null;
  private _quantity: CareLogQuantityValueObject | null;
  private _unit: CareLogUnitValueObject | null;

  constructor(props: ICareLogEntry) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._plantId = props.plantId;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
    this._activityType = props.activityType;
    this._performedAt = props.performedAt;
    this._notes = props.notes;
    this._quantity = props.quantity;
    this._unit = props.unit;
  }

  public create(): void {
    this.assertQuantityUnitPair(this._quantity, this._unit);
    this.apply(
      new CareLogEntryCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareLogEntryAggregate.name,
          entityId: this._id.value,
          entityType: CareLogEntryAggregate.name,
          eventType: CareLogEntryCreatedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public update(props: {
    activityType?: CareLogActivityTypeValueObject;
    performedAt?: CareLogPerformedAtValueObject;
    notes?: CareLogNotesValueObject | null;
    quantity?: CareLogQuantityValueObject | null;
    unit?: CareLogUnitValueObject | null;
  }): void {
    const newQuantity =
      props.quantity !== undefined ? props.quantity : this._quantity;
    const newUnit = props.unit !== undefined ? props.unit : this._unit;
    this.assertQuantityUnitPair(newQuantity, newUnit);

    if (props.activityType !== undefined)
      this._activityType = props.activityType;
    if (props.performedAt !== undefined) this._performedAt = props.performedAt;
    if (props.notes !== undefined) this._notes = props.notes;
    if (props.quantity !== undefined) this._quantity = props.quantity;
    if (props.unit !== undefined) this._unit = props.unit;
    this.touch();

    this.apply(
      new CareLogEntryUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareLogEntryAggregate.name,
          entityId: this._id.value,
          entityType: CareLogEntryAggregate.name,
          eventType: CareLogEntryUpdatedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new CareLogEntryDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: CareLogEntryAggregate.name,
          entityId: this._id.value,
          entityType: CareLogEntryAggregate.name,
          eventType: CareLogEntryDeletedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  private assertQuantityUnitPair(
    quantity: CareLogQuantityValueObject | null,
    unit: CareLogUnitValueObject | null,
  ): void {
    const hasQuantity = quantity !== null;
    const hasUnit = unit !== null;
    if (hasQuantity !== hasUnit) {
      throw new CareLogQuantityUnitMismatchException();
    }
  }

  private toEventData() {
    return {
      id: this._id.value,
      plantId: this._plantId.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      activityType: this._activityType.value,
      performedAt: this._performedAt.value,
    };
  }

  public toPrimitives(): ICareLogEntryPrimitives {
    return {
      id: this._id.value,
      plantId: this._plantId.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      activityType: this._activityType.value,
      performedAt: this._performedAt.value,
      notes: this._notes?.value ?? null,
      quantity: this._quantity?.value ?? null,
      unit: this._unit?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): CareLogIdValueObject {
    return this._id;
  }

  get plantId(): UuidValueObject {
    return this._plantId;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get activityType(): CareLogActivityTypeValueObject {
    return this._activityType;
  }

  get performedAt(): CareLogPerformedAtValueObject {
    return this._performedAt;
  }

  get notes(): CareLogNotesValueObject | null {
    return this._notes;
  }

  get quantity(): CareLogQuantityValueObject | null {
    return this._quantity;
  }

  get unit(): CareLogUnitValueObject | null {
    return this._unit;
  }
}

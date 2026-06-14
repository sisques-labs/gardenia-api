import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { CareLogNotesValueObject } from '@contexts/care-log/domain/value-objects/care-log-notes/care-log-notes.value-object';
import { CareLogQuantityValueObject } from '@contexts/care-log/domain/value-objects/care-log-quantity/care-log-quantity.value-object';
import { CareLogUnitValueObject } from '@contexts/care-log/domain/value-objects/care-log-unit/care-log-unit.value-object';

@Injectable()
export class CareLogEntryBuilder extends BaseBuilder<
  CareLogEntryAggregate,
  CareLogEntryViewModel
> {
  private _plantId!: string;
  private _userId!: string;
  private _spaceId!: string;
  private _activityType!: string;
  private _performedAt!: Date;
  private _notes: string | null = null;
  private _quantity: number | null = null;
  private _unit: string | null = null;

  withPlantId(plantId: string): this {
    this._plantId = plantId;
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

  withActivityType(activityType: string): this {
    this._activityType = activityType;
    return this;
  }

  withPerformedAt(performedAt: Date): this {
    this._performedAt = performedAt;
    return this;
  }

  withNotes(notes: string | null): this {
    this._notes = notes;
    return this;
  }

  withQuantity(quantity: number | null): this {
    this._quantity = quantity;
    return this;
  }

  withUnit(unit: string | null): this {
    this._unit = unit;
    return this;
  }

  public override build(): CareLogEntryAggregate {
    this.validate();
    return new CareLogEntryAggregate({
      id: new CareLogIdValueObject(this._id),
      plantId: new UuidValueObject(this._plantId),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      activityType: new CareLogActivityTypeValueObject(
        this._activityType as CareLogActivityTypeEnum,
      ),
      performedAt: new CareLogPerformedAtValueObject(this._performedAt),
      notes:
        this._notes != null ? new CareLogNotesValueObject(this._notes) : null,
      quantity:
        this._quantity != null
          ? new CareLogQuantityValueObject(this._quantity)
          : null,
      unit:
        this._unit != null
          ? new CareLogUnitValueObject(this._unit as CareLogUnitEnum)
          : null,
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): CareLogEntryViewModel {
    this.validate();
    return new CareLogEntryViewModel({
      id: this._id,
      plantId: this._plantId,
      userId: this._userId,
      spaceId: this._spaceId,
      activityType: this._activityType,
      performedAt: this._performedAt,
      notes: this._notes,
      quantity: this._quantity,
      unit: this._unit,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._plantId) throw new FieldIsRequiredException('plantId');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._activityType) throw new FieldIsRequiredException('activityType');
    if (!this._performedAt) throw new FieldIsRequiredException('performedAt');
  }
}

import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestCropTypeChangedEvent } from '@contexts/harvests/domain/events/field-changed/crop-type-changed/crop-type-changed.event';
import { HarvestHarvestedAtChangedEvent } from '@contexts/harvests/domain/events/field-changed/harvested-at-changed/harvested-at-changed.event';
import { HarvestQuantityChangedEvent } from '@contexts/harvests/domain/events/field-changed/quantity-changed/quantity-changed.event';
import { HarvestUnitChangedEvent } from '@contexts/harvests/domain/events/field-changed/unit-changed/unit-changed.event';
import { HarvestCreatedEvent } from '@contexts/harvests/domain/events/harvest-created/harvest-created.event';
import { HarvestDeletedEvent } from '@contexts/harvests/domain/events/harvest-deleted/harvest-deleted.event';
import { HarvestUpdatedEvent } from '@contexts/harvests/domain/events/harvest-updated/harvest-updated.event';
import { IHarvest } from '@contexts/harvests/domain/interfaces/harvest.interface';
import { IHarvestPrimitives } from '@contexts/harvests/domain/primitives/harvest.primitives';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';

export class HarvestAggregate extends BaseAggregate {
  private readonly _id: HarvestIdValueObject;
  private _cropType: HarvestCropTypeValueObject;
  private _quantity: HarvestQuantityValueObject;
  private _unit: HarvestUnitValueObject;
  private _harvestedAt: HarvestHarvestedAtValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IHarvest) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._cropType = props.cropType;
    this._quantity = props.quantity;
    this._unit = props.unit;
    this._harvestedAt = props.harvestedAt;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public create(): void {
    this.apply(
      new HarvestCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(props: {
    cropType?: HarvestCropTypeValueObject;
    quantity?: HarvestQuantityValueObject;
    unit?: HarvestUnitValueObject;
    harvestedAt?: HarvestHarvestedAtValueObject;
  }): void {
    if (props.cropType !== undefined) this.changeCropType(props.cropType);
    if (props.quantity !== undefined) this.changeQuantity(props.quantity);
    if (props.unit !== undefined) this.changeUnit(props.unit);
    if (props.harvestedAt !== undefined)
      this.changeHarvestedAt(props.harvestedAt);

    this.apply(
      new HarvestUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public delete(): void {
    this.apply(
      new HarvestDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeCropType(newCropType: HarvestCropTypeValueObject): void {
    const oldValue = this._cropType.value;
    const newValue = newCropType.value;
    if (oldValue === newValue) return;
    this._cropType = newCropType;
    this.touch();
    this.apply(
      new HarvestCropTypeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestCropTypeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeQuantity(newQuantity: HarvestQuantityValueObject): void {
    const oldValue = this._quantity.value;
    const newValue = newQuantity.value;
    if (oldValue === newValue) return;
    this._quantity = newQuantity;
    this.touch();
    this.apply(
      new HarvestQuantityChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestQuantityChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeUnit(newUnit: HarvestUnitValueObject): void {
    const oldValue = this._unit.value;
    const newValue = newUnit.value;
    if (oldValue === newValue) return;
    this._unit = newUnit;
    this.touch();
    this.apply(
      new HarvestUnitChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestUnitChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeHarvestedAt(
    newHarvestedAt: HarvestHarvestedAtValueObject,
  ): void {
    const oldValue = this._harvestedAt.value;
    const newValue = newHarvestedAt.value;
    if (oldValue.getTime() === newValue.getTime()) return;
    this._harvestedAt = newHarvestedAt;
    this.touch();
    this.apply(
      new HarvestHarvestedAtChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: HarvestAggregate.name,
          entityId: this._id.value,
          entityType: HarvestAggregate.name,
          eventType: HarvestHarvestedAtChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public toPrimitives(): IHarvestPrimitives {
    return {
      id: this._id.value,
      cropType: this._cropType.value,
      quantity: this._quantity.value,
      unit: this._unit.value,
      harvestedAt: this._harvestedAt.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): HarvestIdValueObject {
    return this._id;
  }
  get cropType(): HarvestCropTypeValueObject {
    return this._cropType;
  }
  get quantity(): HarvestQuantityValueObject {
    return this._quantity;
  }
  get unit(): HarvestUnitValueObject {
    return this._unit;
  }
  get harvestedAt(): HarvestHarvestedAtValueObject {
    return this._harvestedAt;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}

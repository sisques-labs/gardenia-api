import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotCapacityChangedEvent } from '../events/field-changed/capacity-changed/capacity-changed.event';
import { PlantingSpotColumnChangedEvent } from '../events/field-changed/column-changed/column-changed.event';
import { PlantingSpotDescriptionChangedEvent } from '../events/field-changed/description-changed/description-changed.event';
import { PlantingSpotDimensionsChangedEvent } from '../events/field-changed/dimensions-changed/dimensions-changed.event';
import { PlantingSpotNameChangedEvent } from '../events/field-changed/name-changed/name-changed.event';
import { PlantingSpotRowChangedEvent } from '../events/field-changed/row-changed/row-changed.event';
import { PlantingSpotSoilTypeChangedEvent } from '../events/field-changed/soil-type-changed/soil-type-changed.event';
import { PlantingSpotStatusChangedEvent } from '../events/field-changed/status-changed/status-changed.event';
import { PlantingSpotTypeChangedEvent } from '../events/field-changed/type-changed/type-changed.event';
import { PlantingSpotCreatedEvent } from '../events/planting-spot-created/planting-spot-created.event';
import { PlantingSpotDeletedEvent } from '../events/planting-spot-deleted/planting-spot-deleted.event';
import { PlantingSpotUpdatedEvent } from '../events/planting-spot-updated/planting-spot-updated.event';
import { IPlantingSpot } from '../interfaces/planting-spot.interface';
import { IPlantingSpotPrimitives } from '../primitives/planting-spot.primitives';
import { PlantingSpotStatusEnum } from '../enums/planting-spot-status.enum';
import { PlantingSpotCapacityValueObject } from '../value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '../value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '../value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '../value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotFallowSinceValueObject } from '../value-objects/planting-spot-fallow-since/planting-spot-fallow-since.value-object';
import { PlantingSpotIdValueObject } from '../value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '../value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '../value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '../value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotStatusValueObject } from '../value-objects/planting-spot-status/planting-spot-status.value-object';
import { PlantingSpotTypeValueObject } from '../value-objects/planting-spot-type/planting-spot-type.value-object';

export class PlantingSpotAggregate extends BaseAggregate {
  private readonly _id: PlantingSpotIdValueObject;
  private _name: PlantingSpotNameValueObject;
  private _type: PlantingSpotTypeValueObject;
  private _description: PlantingSpotDescriptionValueObject | null;
  private _capacity: PlantingSpotCapacityValueObject | null;
  private _row: PlantingSpotRowValueObject | null;
  private _column: PlantingSpotColumnValueObject | null;
  private _dimensions: PlantingSpotDimensionsValueObject | null;
  private _soilType: PlantingSpotSoilTypeValueObject | null;
  private _status: PlantingSpotStatusValueObject;
  private _fallowSince: PlantingSpotFallowSinceValueObject | null;
  private _qrId: UuidValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;

  constructor(props: IPlantingSpot) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._type = props.type;
    this._description = props.description;
    this._capacity = props.capacity;
    this._row = props.row;
    this._column = props.column;
    this._dimensions = props.dimensions;
    this._soilType = props.soilType;
    this._status = props.status;
    this._fallowSince = props.fallowSince;
    this._qrId = props.qrId;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
  }

  public linkQr(qrId: UuidValueObject): void {
    this._qrId = qrId;
    this.touch();
  }

  public create(): void {
    this.apply(
      new PlantingSpotCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public update(props: {
    name?: PlantingSpotNameValueObject;
    type?: PlantingSpotTypeValueObject;
    description?: PlantingSpotDescriptionValueObject | null;
    capacity?: PlantingSpotCapacityValueObject | null;
    row?: PlantingSpotRowValueObject | null;
    column?: PlantingSpotColumnValueObject | null;
    dimensions?: PlantingSpotDimensionsValueObject | null;
    soilType?: PlantingSpotSoilTypeValueObject | null;
  }): void {
    if (props.name !== undefined) this.changeName(props.name);
    if (props.type !== undefined) this.changeType(props.type);
    if (props.description !== undefined)
      this.changeDescription(props.description);
    if (props.capacity !== undefined) this.changeCapacity(props.capacity);
    if (props.row !== undefined) this.changeRow(props.row);
    if (props.column !== undefined) this.changeColumn(props.column);
    if (props.dimensions !== undefined) this.changeDimensions(props.dimensions);
    if (props.soilType !== undefined) this.changeSoilType(props.soilType);

    this.apply(
      new PlantingSpotUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotUpdatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public markFallow(): void {
    this.changeStatus(
      new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.FALLOW),
    );
  }

  public markActive(): void {
    this.changeStatus(
      new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE),
    );
  }

  public delete(): void {
    this.apply(
      new PlantingSpotDeletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  private changeName(newName: PlantingSpotNameValueObject): void {
    const oldValue = this._name.value;
    const newValue = newName.value;
    if (oldValue === newValue) return;
    this._name = newName;
    this.touch();
    this.apply(
      new PlantingSpotNameChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotNameChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeType(newType: PlantingSpotTypeValueObject): void {
    const oldValue = this._type.value;
    const newValue = newType.value;
    if (oldValue === newValue) return;
    this._type = newType;
    this.touch();
    this.apply(
      new PlantingSpotTypeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotTypeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDescription(
    newDescription: PlantingSpotDescriptionValueObject | null,
  ): void {
    const oldValue = this._description?.value ?? null;
    const newValue = newDescription?.value ?? null;
    if (oldValue === newValue) return;
    this._description = newDescription;
    this.touch();
    this.apply(
      new PlantingSpotDescriptionChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotDescriptionChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeCapacity(
    newCapacity: PlantingSpotCapacityValueObject | null,
  ): void {
    const oldValue = this._capacity?.value ?? null;
    const newValue = newCapacity?.value ?? null;
    if (oldValue === newValue) return;
    this._capacity = newCapacity;
    this.touch();
    this.apply(
      new PlantingSpotCapacityChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotCapacityChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeRow(newRow: PlantingSpotRowValueObject | null): void {
    const oldValue = this._row?.value ?? null;
    const newValue = newRow?.value ?? null;
    if (oldValue === newValue) return;
    this._row = newRow;
    this.touch();
    this.apply(
      new PlantingSpotRowChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotRowChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeColumn(newColumn: PlantingSpotColumnValueObject | null): void {
    const oldValue = this._column?.value ?? null;
    const newValue = newColumn?.value ?? null;
    if (oldValue === newValue) return;
    this._column = newColumn;
    this.touch();
    this.apply(
      new PlantingSpotColumnChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotColumnChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeDimensions(
    newDimensions: PlantingSpotDimensionsValueObject | null,
  ): void {
    const oldValue = this._dimensions
      ? {
          width: this._dimensions.width,
          height: this._dimensions.height,
          length: this._dimensions.length,
        }
      : null;
    const newValue = newDimensions
      ? {
          width: newDimensions.width,
          height: newDimensions.height,
          length: newDimensions.length,
        }
      : null;
    const changed =
      oldValue?.width !== newValue?.width ||
      oldValue?.height !== newValue?.height ||
      oldValue?.length !== newValue?.length;
    if (!changed) return;
    this._dimensions = newDimensions;
    this.touch();
    this.apply(
      new PlantingSpotDimensionsChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotDimensionsChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeSoilType(
    newSoilType: PlantingSpotSoilTypeValueObject | null,
  ): void {
    const oldValue = this._soilType?.value ?? null;
    const newValue = newSoilType?.value ?? null;
    if (oldValue === newValue) return;
    this._soilType = newSoilType;
    this.touch();
    this.apply(
      new PlantingSpotSoilTypeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotSoilTypeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeStatus(newStatus: PlantingSpotStatusValueObject): void {
    const oldValue = this._status.value;
    const newValue = newStatus.value;
    if (oldValue === newValue) return;
    this._status = newStatus;
    this._fallowSince =
      newValue === PlantingSpotStatusEnum.FALLOW
        ? new PlantingSpotFallowSinceValueObject(new Date())
        : null;
    this.touch();
    this.apply(
      new PlantingSpotStatusChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: PlantingSpotAggregate.name,
          entityId: this._id.value,
          entityType: PlantingSpotAggregate.name,
          eventType: PlantingSpotStatusChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  public toPrimitives(): IPlantingSpotPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      type: this._type.value,
      description: this._description?.value ?? null,
      capacity: this._capacity?.value ?? null,
      row: this._row?.value ?? null,
      column: this._column?.value ?? null,
      dimensionsWidth: this._dimensions?.width ?? null,
      dimensionsHeight: this._dimensions?.height ?? null,
      dimensionsLength: this._dimensions?.length ?? null,
      soilType: this._soilType?.value ?? null,
      status: this._status.value,
      fallowSince: this._fallowSince?.value ?? null,
      qrId: this._qrId?.value ?? null,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): PlantingSpotIdValueObject {
    return this._id;
  }
  get name(): PlantingSpotNameValueObject {
    return this._name;
  }
  get type(): PlantingSpotTypeValueObject {
    return this._type;
  }
  get description(): PlantingSpotDescriptionValueObject | null {
    return this._description;
  }
  get capacity(): PlantingSpotCapacityValueObject | null {
    return this._capacity;
  }
  get row(): PlantingSpotRowValueObject | null {
    return this._row;
  }
  get column(): PlantingSpotColumnValueObject | null {
    return this._column;
  }
  get dimensions(): PlantingSpotDimensionsValueObject | null {
    return this._dimensions;
  }
  get soilType(): PlantingSpotSoilTypeValueObject | null {
    return this._soilType;
  }
  get status(): PlantingSpotStatusValueObject {
    return this._status;
  }
  get fallowSince(): PlantingSpotFallowSinceValueObject | null {
    return this._fallowSince;
  }
  get qrId(): UuidValueObject | null {
    return this._qrId;
  }
  get userId(): UuidValueObject {
    return this._userId;
  }
  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}

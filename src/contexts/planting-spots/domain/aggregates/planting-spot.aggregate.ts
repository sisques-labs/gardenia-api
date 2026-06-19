import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotNameChangedEvent } from '../events/field-changed/name-changed/name-changed.event';
import { PlantingSpotTypeChangedEvent } from '../events/field-changed/type-changed/type-changed.event';
import { PlantingSpotDescriptionChangedEvent } from '../events/field-changed/description-changed/description-changed.event';
import { PlantingSpotCreatedEvent } from '../events/planting-spot-created/planting-spot-created.event';
import { PlantingSpotUpdatedEvent } from '../events/planting-spot-updated/planting-spot-updated.event';
import { PlantingSpotDeletedEvent } from '../events/planting-spot-deleted/planting-spot-deleted.event';
import { IPlantingSpot } from '../interfaces/planting-spot.interface';
import { IPlantingSpotPrimitives } from '../primitives/planting-spot.primitives';
import { PlantingSpotCapacityValueObject } from '../value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '../value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '../value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '../value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotIdValueObject } from '../value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '../value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '../value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '../value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
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
    this._userId = props.userId;
    this._spaceId = props.spaceId;
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
    if (props.name !== undefined) {
      this.changeName(props.name);
    }

    if (props.type !== undefined) {
      this.changeType(props.type);
    }

    if (props.description !== undefined) {
      this.changeDescription(props.description);
    }

    if (
      props.capacity !== undefined &&
      props.capacity?.value !== this._capacity?.value
    ) {
      this._capacity = props.capacity;
      this.touch();
    }

    if (
      props.row !== undefined &&
      props.row?.value !== this._row?.value
    ) {
      this._row = props.row;
      this.touch();
    }

    if (
      props.column !== undefined &&
      props.column?.value !== this._column?.value
    ) {
      this._column = props.column;
      this.touch();
    }

    if (
      props.dimensions !== undefined &&
      props.dimensions?.value !== this._dimensions?.value
    ) {
      this._dimensions = props.dimensions;
      this.touch();
    }

    if (
      props.soilType !== undefined &&
      props.soilType?.value !== this._soilType?.value
    ) {
      this._soilType = props.soilType;
      this.touch();
    }

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

  public toPrimitives(): IPlantingSpotPrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      type: this._type.value,
      description: this._description?.value ?? null,
      capacity: this._capacity?.value ?? null,
      row: this._row?.value ?? null,
      column: this._column?.value ?? null,
      dimensions: this._dimensions?.value ?? null,
      soilType: this._soilType?.value ?? null,
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

  get userId(): UuidValueObject {
    return this._userId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }
}

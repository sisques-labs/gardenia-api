import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '../aggregates/planting-spot.aggregate';
import { PlantingSpotTypeEnum } from '../enums/planting-spot-type.enum';
import { PlantingSpotCapacityValueObject } from '../value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '../value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '../value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '../value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotIdValueObject } from '../value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '../value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '../value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '../value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotTypeValueObject } from '../value-objects/planting-spot-type/planting-spot-type.value-object';
import { PlantingSpotViewModel } from '../view-models/planting-spot.view-model';

@Injectable()
export class PlantingSpotBuilder extends BaseBuilder<
  PlantingSpotAggregate,
  PlantingSpotViewModel
> {
  private _name!: string;
  private _type!: string;
  private _description: string | null = null;
  private _capacity: number | null = null;
  private _row: number | null = null;
  private _column: number | null = null;
  private _dimensions: string | null = null;
  private _soilType: string | null = null;
  private _userId!: string;
  private _spaceId!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withType(type: string): this {
    this._type = type;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withCapacity(capacity: number | null): this {
    this._capacity = capacity;
    return this;
  }

  withRow(row: number | null): this {
    this._row = row;
    return this;
  }

  withColumn(column: number | null): this {
    this._column = column;
    return this;
  }

  withDimensions(dimensions: string | null): this {
    this._dimensions = dimensions;
    return this;
  }

  withSoilType(soilType: string | null): this {
    this._soilType = soilType;
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

  public override build(): PlantingSpotAggregate {
    this.validate();
    return new PlantingSpotAggregate({
      id: new PlantingSpotIdValueObject(this._id),
      name: new PlantingSpotNameValueObject(this._name),
      type: new PlantingSpotTypeValueObject(this._type as PlantingSpotTypeEnum),
      description:
        this._description != null
          ? new PlantingSpotDescriptionValueObject(this._description)
          : null,
      capacity:
        this._capacity != null
          ? new PlantingSpotCapacityValueObject(this._capacity)
          : null,
      row:
        this._row != null
          ? new PlantingSpotRowValueObject(this._row)
          : null,
      column:
        this._column != null
          ? new PlantingSpotColumnValueObject(this._column)
          : null,
      dimensions:
        this._dimensions != null
          ? new PlantingSpotDimensionsValueObject(this._dimensions)
          : null,
      soilType:
        this._soilType != null
          ? new PlantingSpotSoilTypeValueObject(this._soilType)
          : null,
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): PlantingSpotViewModel {
    this.validate();
    return new PlantingSpotViewModel({
      id: this._id,
      name: this._name,
      type: this._type,
      description: this._description,
      capacity: this._capacity,
      row: this._row,
      column: this._column,
      dimensions: this._dimensions,
      soilType: this._soilType,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._type) throw new FieldIsRequiredException('type');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}

import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '../aggregates/planting-spot.aggregate';
import { PlantingSpotStatusEnum } from '../enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '../enums/planting-spot-type.enum';
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
import { PlantingSpotQrViewModel } from '../view-models/planting-spot-qr.view-model';
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
  private _dimensionsWidth: number | null = null;
  private _dimensionsHeight: number | null = null;
  private _dimensionsLength: number | null = null;
  private _soilType: string | null = null;
  private _status: string = PlantingSpotStatusEnum.ACTIVE;
  private _fallowSince: Date | null = null;
  private _qrId: string | null = null;
  private _qr: PlantingSpotQrViewModel | null = null;
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

  withDimensionsWidth(width: number | null): this {
    this._dimensionsWidth = width;
    return this;
  }

  withDimensionsHeight(height: number | null): this {
    this._dimensionsHeight = height;
    return this;
  }

  withDimensionsLength(length: number | null): this {
    this._dimensionsLength = length;
    return this;
  }

  withSoilType(soilType: string | null): this {
    this._soilType = soilType;
    return this;
  }

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withFallowSince(fallowSince: Date | null): this {
    this._fallowSince = fallowSince;
    return this;
  }

  withQrId(qrId: string | null): this {
    this._qrId = qrId;
    return this;
  }

  withQr(qr: PlantingSpotQrViewModel | null): this {
    this._qr = qr;
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

  private buildDimensions(): PlantingSpotDimensionsValueObject | null {
    if (
      this._dimensionsWidth == null &&
      this._dimensionsHeight == null &&
      this._dimensionsLength == null
    ) {
      return null;
    }
    return new PlantingSpotDimensionsValueObject({
      width: this._dimensionsWidth,
      height: this._dimensionsHeight,
      length: this._dimensionsLength,
    });
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
      row: this._row != null ? new PlantingSpotRowValueObject(this._row) : null,
      column:
        this._column != null
          ? new PlantingSpotColumnValueObject(this._column)
          : null,
      dimensions: this.buildDimensions(),
      soilType:
        this._soilType != null
          ? new PlantingSpotSoilTypeValueObject(this._soilType)
          : null,
      status: new PlantingSpotStatusValueObject(
        this._status as PlantingSpotStatusEnum,
      ),
      fallowSince:
        this._fallowSince != null
          ? new PlantingSpotFallowSinceValueObject(this._fallowSince)
          : null,
      qrId: this._qrId != null ? new UuidValueObject(this._qrId) : null,
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
      dimensionsWidth: this._dimensionsWidth,
      dimensionsHeight: this._dimensionsHeight,
      dimensionsLength: this._dimensionsLength,
      soilType: this._soilType,
      status: this._status,
      fallowSince: this._fallowSince,
      qrId: this._qrId,
      qr: this._qr,
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

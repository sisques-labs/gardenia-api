import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';

@Injectable()
export class HarvestBuilder extends BaseBuilder<
  HarvestAggregate,
  HarvestViewModel
> {
  private _cropType!: string;
  private _quantity!: number;
  private _unit!: string;
  private _harvestedAt!: Date;
  private _userId!: string;
  private _spaceId!: string;

  withCropType(cropType: string): this {
    this._cropType = cropType;
    return this;
  }

  withQuantity(quantity: number): this {
    this._quantity = quantity;
    return this;
  }

  withUnit(unit: string): this {
    this._unit = unit;
    return this;
  }

  withHarvestedAt(harvestedAt: Date): this {
    this._harvestedAt = harvestedAt;
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

  public override build(): HarvestAggregate {
    this.validate();
    return new HarvestAggregate({
      id: new HarvestIdValueObject(this._id),
      cropType: new HarvestCropTypeValueObject(this._cropType),
      quantity: new HarvestQuantityValueObject(this._quantity),
      unit: new HarvestUnitValueObject(this._unit as HarvestUnitEnum),
      harvestedAt: new HarvestHarvestedAtValueObject(this._harvestedAt),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): HarvestViewModel {
    this.validate();
    return new HarvestViewModel({
      id: this._id,
      cropType: this._cropType,
      quantity: this._quantity,
      unit: this._unit,
      harvestedAt: this._harvestedAt,
      userId: this._userId,
      spaceId: this._spaceId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._cropType) throw new FieldIsRequiredException('cropType');
    if (this._quantity === undefined)
      throw new FieldIsRequiredException('quantity');
    if (!this._unit) throw new FieldIsRequiredException('unit');
    if (!this._harvestedAt) throw new FieldIsRequiredException('harvestedAt');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
  }
}

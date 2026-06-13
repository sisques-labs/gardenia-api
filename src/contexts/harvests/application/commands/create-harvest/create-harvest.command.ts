import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';

export type CreateHarvestCommandInput = {
  cropType: string;
  quantity: number;
  unit: string;
  harvestedAt?: Date;
  userId: string;
  spaceId: string;
};

export class CreateHarvestCommand {
  public readonly cropType: HarvestCropTypeValueObject;
  public readonly quantity: HarvestQuantityValueObject;
  public readonly unit: HarvestUnitValueObject;
  public readonly harvestedAt: HarvestHarvestedAtValueObject;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreateHarvestCommandInput) {
    this.cropType = new HarvestCropTypeValueObject(input.cropType);
    this.quantity = new HarvestQuantityValueObject(input.quantity);
    this.unit = new HarvestUnitValueObject(input.unit as HarvestUnitEnum);
    this.harvestedAt = new HarvestHarvestedAtValueObject(
      input.harvestedAt ?? new Date(),
    );
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

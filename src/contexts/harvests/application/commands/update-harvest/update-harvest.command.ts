import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { IHarvestPrimitives } from '@contexts/harvests/domain/primitives/harvest.primitives';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';

import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type UpdateHarvestCommandInput = Pick<IHarvestPrimitives, 'id'> &
  Partial<
    Omit<
      IHarvestPrimitives,
      'id' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'
    >
  >;

export class UpdateHarvestCommand {
  public readonly id: UuidValueObject;
  public readonly cropType: HarvestCropTypeValueObject | undefined;
  public readonly quantity: HarvestQuantityValueObject | undefined;
  public readonly unit: HarvestUnitValueObject | undefined;
  public readonly harvestedAt: HarvestHarvestedAtValueObject | undefined;

  constructor(input: UpdateHarvestCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.cropType = input.cropType
      ? new HarvestCropTypeValueObject(input.cropType)
      : undefined;
    this.quantity =
      input.quantity !== undefined
        ? new HarvestQuantityValueObject(input.quantity)
        : undefined;
    this.unit = input.unit
      ? new HarvestUnitValueObject(input.unit as HarvestUnitEnum)
      : undefined;
    this.harvestedAt = input.harvestedAt
      ? new HarvestHarvestedAtValueObject(input.harvestedAt)
      : undefined;
  }
}

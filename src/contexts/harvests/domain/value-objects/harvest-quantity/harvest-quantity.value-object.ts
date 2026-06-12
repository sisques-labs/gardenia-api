import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { InvalidHarvestQuantityException } from '@contexts/harvests/domain/exceptions/invalid-harvest-quantity.exception';

export class HarvestQuantityValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value);
    if (value <= 0) throw new InvalidHarvestQuantityException(value);
  }
}

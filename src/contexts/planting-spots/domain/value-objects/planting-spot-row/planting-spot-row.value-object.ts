import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotInvalidRowException } from '@contexts/planting-spots/domain/exceptions/planting-spot-invalid-row.exception';

export class PlantingSpotRowValueObject extends NumberValueObject {
  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new PlantingSpotInvalidRowException(value);
    }
    try {
      super(value, { min: 1 });
    } catch {
      throw new PlantingSpotInvalidRowException(value);
    }
  }
}

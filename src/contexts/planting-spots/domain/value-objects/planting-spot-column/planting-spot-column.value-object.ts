import { NumberValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotInvalidColumnException } from '@contexts/planting-spots/domain/exceptions/planting-spot-invalid-column.exception';

export class PlantingSpotColumnValueObject extends NumberValueObject {
  constructor(value: number) {
    if (!Number.isInteger(value)) {
      throw new PlantingSpotInvalidColumnException(value);
    }
    try {
      super(value, { min: 1 });
    } catch {
      throw new PlantingSpotInvalidColumnException(value);
    }
  }
}

import { NumberValueObject } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesImportLimitValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1, allowDecimals: false });
  }
}

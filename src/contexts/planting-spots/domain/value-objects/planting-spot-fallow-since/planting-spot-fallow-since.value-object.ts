import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class PlantingSpotFallowSinceValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}

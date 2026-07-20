import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class PlantIdentificationIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}

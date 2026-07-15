import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export class PlantPhotoIdValueObject extends UuidValueObject {
  constructor(value: string) {
    super(value);
  }
}

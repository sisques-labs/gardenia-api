import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type PlantPhotoFindByIdQueryInput = Pick<IPlantPhotoPrimitives, 'id'>;

export class PlantPhotoFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: PlantPhotoFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}

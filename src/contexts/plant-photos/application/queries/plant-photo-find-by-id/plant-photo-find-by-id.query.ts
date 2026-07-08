import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';
import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';

export type PlantPhotoFindByIdQueryInput = Pick<IPlantPhotoPrimitives, 'id'>;

export class PlantPhotoFindByIdQuery {
  public readonly id: PlantPhotoIdValueObject;

  constructor(input: PlantPhotoFindByIdQueryInput) {
    this.id = new PlantPhotoIdValueObject(input.id);
  }
}

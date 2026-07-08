import { PlantPhotoIdValueObject } from '@contexts/plant-photos/domain/value-objects/plant-photo-id/plant-photo-id.value-object';

export type PlantPhotoFindByIdQueryInput = {
  id: string;
};

export class PlantPhotoFindByIdQuery {
  public readonly id: PlantPhotoIdValueObject;

  constructor(input: PlantPhotoFindByIdQueryInput) {
    this.id = new PlantPhotoIdValueObject(input.id);
  }
}

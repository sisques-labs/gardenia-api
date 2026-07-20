import { IPlantIdentificationPrimitives } from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';

export type PlantIdentificationFindByIdQueryInput = Pick<
  IPlantIdentificationPrimitives,
  'id'
>;

export class PlantIdentificationFindByIdQuery {
  public readonly id: PlantIdentificationIdValueObject;

  constructor(input: PlantIdentificationFindByIdQueryInput) {
    this.id = new PlantIdentificationIdValueObject(input.id);
  }
}

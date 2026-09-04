import { IPlantIdentificationPrimitives } from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type PlantIdentificationFindByIdQueryInput = Pick<
  IPlantIdentificationPrimitives,
  'id'
>;

export class PlantIdentificationFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: PlantIdentificationFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}

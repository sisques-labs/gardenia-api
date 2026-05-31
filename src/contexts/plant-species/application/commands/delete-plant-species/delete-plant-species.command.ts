import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';

export interface DeletePlantSpeciesCommandInput {
  id: string;
}

export class DeletePlantSpeciesCommand {
  public readonly id: PlantSpeciesIdValueObject;

  constructor(input: DeletePlantSpeciesCommandInput) {
    this.id = new PlantSpeciesIdValueObject(input.id);
  }
}

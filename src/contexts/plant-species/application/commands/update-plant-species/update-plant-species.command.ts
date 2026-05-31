import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-name/plant-species-name.value-object';

export interface UpdatePlantSpeciesCommandInput {
  id: string;
  name?: string;
}

export class UpdatePlantSpeciesCommand {
  public readonly id: PlantSpeciesIdValueObject;
  public readonly name: PlantSpeciesNameValueObject | undefined;

  constructor(input: UpdatePlantSpeciesCommandInput) {
    this.id = new PlantSpeciesIdValueObject(input.id);
    this.name = input.name
      ? new PlantSpeciesNameValueObject(input.name)
      : undefined;
  }
}

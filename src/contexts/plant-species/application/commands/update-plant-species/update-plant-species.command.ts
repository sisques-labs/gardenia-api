import { PlantSpeciesGbifKeyValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-gbif-key/plant-species-gbif-key.value-object';

import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface UpdatePlantSpeciesCommandInput {
  id: string;
  scientificName?: string;
  gbifKey?: number | null;
}

export class UpdatePlantSpeciesCommand {
  public readonly id: UuidValueObject;
  public readonly scientificName:
    PlantSpeciesScientificNameValueObject | undefined;
  public readonly gbifKey: PlantSpeciesGbifKeyValueObject | null | undefined;

  constructor(input: UpdatePlantSpeciesCommandInput) {
    this.id = new UuidValueObject(input.id);
    this.scientificName = input.scientificName
      ? new PlantSpeciesScientificNameValueObject(input.scientificName)
      : undefined;
    this.gbifKey =
      input.gbifKey !== undefined
        ? input.gbifKey != null
          ? new PlantSpeciesGbifKeyValueObject(input.gbifKey)
          : null
        : undefined;
  }
}

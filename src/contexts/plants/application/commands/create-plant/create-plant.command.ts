import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantGbifSpeciesKeyValueObject } from '@contexts/plants/domain/value-objects/plant-gbif-species-key/plant-gbif-species-key.value-object';
import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plants/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface CreatePlantCommandInput {
  name: string;
  gbifSpeciesKey?: number | null;
  speciesScientificName?: string | null;
  imageUrl?: string | null;
  userId: string;
}

export class CreatePlantCommand {
  public readonly name: PlantNameValueObject;
  public readonly gbifSpeciesKey: PlantGbifSpeciesKeyValueObject | null;
  public readonly speciesScientificName: PlantSpeciesScientificNameValueObject | null;
  public readonly imageUrl: PlantImageUrlValueObject | null;
  public readonly userId: UuidValueObject;

  constructor(input: CreatePlantCommandInput) {
    this.name = new PlantNameValueObject(input.name);
    this.gbifSpeciesKey =
      input.gbifSpeciesKey != null
        ? new PlantGbifSpeciesKeyValueObject(input.gbifSpeciesKey)
        : null;
    this.speciesScientificName =
      input.speciesScientificName != null
        ? new PlantSpeciesScientificNameValueObject(input.speciesScientificName)
        : null;
    this.imageUrl =
      input.imageUrl != null
        ? new PlantImageUrlValueObject(input.imageUrl)
        : null;
    this.userId = new UuidValueObject(input.userId);
  }
}

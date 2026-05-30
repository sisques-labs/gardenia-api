import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '@contexts/plants/domain/value-objects/plant-species/plant-species.value-object';

export interface CreatePlantCommandInput {
  name: string;
  species?: string | null;
  imageUrl?: string | null;
  userId: string;
}

export class CreatePlantCommand {
  public readonly name: PlantNameValueObject;
  public readonly species: PlantSpeciesValueObject | null;
  public readonly imageUrl: PlantImageUrlValueObject | null;
  public readonly userId: UuidValueObject;

  constructor(input: CreatePlantCommandInput) {
    this.name = new PlantNameValueObject(input.name);
    this.species =
      input.species != null ? new PlantSpeciesValueObject(input.species) : null;
    this.imageUrl =
      input.imageUrl != null
        ? new PlantImageUrlValueObject(input.imageUrl)
        : null;
    this.userId = new UuidValueObject(input.userId);
  }
}

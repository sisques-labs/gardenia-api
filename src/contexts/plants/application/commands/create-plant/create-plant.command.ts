import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantLinkedSpeciesIdValueObject } from '@contexts/plants/domain/value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';

export interface CreatePlantCommandInput {
  name: string;
  plantSpeciesId?: string | null;
  imageUrl?: string | null;
  userId: string;
}

export class CreatePlantCommand {
  public readonly name: PlantNameValueObject;
  public readonly plantSpeciesId: PlantLinkedSpeciesIdValueObject | null;
  public readonly imageUrl: PlantImageUrlValueObject | null;
  public readonly userId: UuidValueObject;

  constructor(input: CreatePlantCommandInput) {
    this.name = new PlantNameValueObject(input.name);
    this.plantSpeciesId =
      input.plantSpeciesId != null
        ? new PlantLinkedSpeciesIdValueObject(input.plantSpeciesId)
        : null;
    this.imageUrl =
      input.imageUrl != null
        ? new PlantImageUrlValueObject(input.imageUrl)
        : null;
    this.userId = new UuidValueObject(input.userId);
  }
}

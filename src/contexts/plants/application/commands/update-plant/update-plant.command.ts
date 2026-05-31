import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantLinkedSpeciesIdValueObject } from '@contexts/plants/domain/value-objects/plant-linked-species-id/plant-linked-species-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';

export interface UpdatePlantCommandInput {
  plantId: string;
  name?: string;
  plantSpeciesId?: string | null;
  imageUrl?: string | null;
  requestingUserId: string;
}

export class UpdatePlantCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly name: PlantNameValueObject | undefined;
  public readonly plantSpeciesId:
    | PlantLinkedSpeciesIdValueObject
    | null
    | undefined;
  public readonly imageUrl: PlantImageUrlValueObject | null | undefined;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: UpdatePlantCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.name = input.name ? new PlantNameValueObject(input.name) : undefined;
    this.plantSpeciesId =
      input.plantSpeciesId !== undefined
        ? input.plantSpeciesId != null
          ? new PlantLinkedSpeciesIdValueObject(input.plantSpeciesId)
          : null
        : undefined;
    this.imageUrl =
      input.imageUrl !== undefined
        ? input.imageUrl != null
          ? new PlantImageUrlValueObject(input.imageUrl)
          : null
        : undefined;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesValueObject } from '@contexts/plants/domain/value-objects/plant-species/plant-species.value-object';

export interface UpdatePlantCommandInput {
  plantId: string;
  name?: string;
  species?: string | null;
  imageUrl?: string | null;
  requestingUserId: string;
}

export class UpdatePlantCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly name: PlantNameValueObject | undefined;
  public readonly species: PlantSpeciesValueObject | null | undefined;
  public readonly imageUrl: PlantImageUrlValueObject | null | undefined;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: UpdatePlantCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.name = input.name ? new PlantNameValueObject(input.name) : undefined;
    this.species =
      input.species !== undefined
        ? input.species != null
          ? new PlantSpeciesValueObject(input.species)
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

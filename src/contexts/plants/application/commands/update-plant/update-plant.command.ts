import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantGbifSpeciesKeyValueObject } from '@contexts/plants/domain/value-objects/plant-gbif-species-key/plant-gbif-species-key.value-object';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantImageUrlValueObject } from '@contexts/plants/domain/value-objects/plant-image-url/plant-image-url.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plants/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface UpdatePlantCommandInput {
  plantId: string;
  name?: string;
  gbifSpeciesKey?: number | null;
  speciesScientificName?: string | null;
  imageUrl?: string | null;
  plantingSpotId?: string | null;
  requestingUserId: string;
}

export class UpdatePlantCommand {
  public readonly plantId: PlantIdValueObject;
  public readonly name: PlantNameValueObject | undefined;
  public readonly gbifSpeciesKey:
    | PlantGbifSpeciesKeyValueObject
    | null
    | undefined;
  public readonly speciesScientificName:
    | PlantSpeciesScientificNameValueObject
    | null
    | undefined;
  public readonly imageUrl: PlantImageUrlValueObject | null | undefined;
  public readonly plantingSpotId: UuidValueObject | null | undefined;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: UpdatePlantCommandInput) {
    this.plantId = new PlantIdValueObject(input.plantId);
    this.name = input.name ? new PlantNameValueObject(input.name) : undefined;
    this.gbifSpeciesKey =
      input.gbifSpeciesKey !== undefined
        ? input.gbifSpeciesKey != null
          ? new PlantGbifSpeciesKeyValueObject(input.gbifSpeciesKey)
          : null
        : undefined;
    this.speciesScientificName =
      input.speciesScientificName !== undefined
        ? input.speciesScientificName != null
          ? new PlantSpeciesScientificNameValueObject(
              input.speciesScientificName,
            )
          : null
        : undefined;
    this.imageUrl =
      input.imageUrl !== undefined
        ? input.imageUrl != null
          ? new PlantImageUrlValueObject(input.imageUrl)
          : null
        : undefined;
    this.plantingSpotId =
      input.plantingSpotId !== undefined
        ? input.plantingSpotId != null
          ? new UuidValueObject(input.plantingSpotId)
          : null
        : undefined;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}

import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesIdValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-id/plant-species-id.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';
import { PlantSpeciesScientificNameValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-scientific-name/plant-species-scientific-name.value-object';

export interface UpdatePlantSpeciesCommandInput {
  id: string;
  scientificName?: string;
  description?: string | null;
  imageUrl?: string | null;
}

export class UpdatePlantSpeciesCommand {
  public readonly id: PlantSpeciesIdValueObject;
  public readonly scientificName:
    | PlantSpeciesScientificNameValueObject
    | undefined;
  public readonly description:
    | PlantSpeciesDescriptionValueObject
    | null
    | undefined;
  public readonly imageUrl: PlantSpeciesImageUrlValueObject | null | undefined;

  constructor(input: UpdatePlantSpeciesCommandInput) {
    this.id = new PlantSpeciesIdValueObject(input.id);
    this.scientificName = input.scientificName
      ? new PlantSpeciesScientificNameValueObject(input.scientificName)
      : undefined;
    this.description =
      input.description !== undefined
        ? input.description != null
          ? new PlantSpeciesDescriptionValueObject(input.description)
          : null
        : undefined;
    this.imageUrl =
      input.imageUrl !== undefined
        ? input.imageUrl != null
          ? new PlantSpeciesImageUrlValueObject(input.imageUrl)
          : null
        : undefined;
  }
}

import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationImageUrlValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-image-url/plant-identification-image-url.value-object';
import { PlantIdentificationNameValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-name/plant-identification-name.value-object';

export interface CreatePlantFromIdentificationCommandInput {
  identificationId: string;
  name: string;
  imageUrl?: string | null;
  requestingUserId: string;
}

export class CreatePlantFromIdentificationCommand {
  public readonly identificationId: PlantIdentificationIdValueObject;
  public readonly name: PlantIdentificationNameValueObject;
  public readonly imageUrl: PlantIdentificationImageUrlValueObject | null;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: CreatePlantFromIdentificationCommandInput) {
    this.identificationId = new PlantIdentificationIdValueObject(
      input.identificationId,
    );
    this.name = new PlantIdentificationNameValueObject(input.name);
    this.imageUrl =
      input.imageUrl != null
        ? new PlantIdentificationImageUrlValueObject(input.imageUrl)
        : null;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}

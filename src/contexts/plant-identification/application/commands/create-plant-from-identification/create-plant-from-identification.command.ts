import { StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';

/**
 * `name`'s max length (100) mirrors `plants`' own `PlantNameValueObject` —
 * kept as a plain literal rather than an import, since cross-context imports
 * are only allowed from `infrastructure/adapters/` (see `IPlantsPort`).
 * `plants`' own `CreatePlantCommand` re-validates the name regardless.
 */
const NAME_MAX_LENGTH = 100;

export interface CreatePlantFromIdentificationCommandInput {
  identificationId: string;
  name: string;
  imageUrl?: string | null;
  requestingUserId: string;
}

export class CreatePlantFromIdentificationCommand {
  public readonly identificationId: PlantIdentificationIdValueObject;
  public readonly name: StringValueObject;
  public readonly imageUrl: StringValueObject | null;
  public readonly requestingUserId: UuidValueObject;

  constructor(input: CreatePlantFromIdentificationCommandInput) {
    this.identificationId = new PlantIdentificationIdValueObject(
      input.identificationId,
    );
    this.name = new StringValueObject(input.name, {
      maxLength: NAME_MAX_LENGTH,
      allowEmpty: false,
    });
    this.imageUrl =
      input.imageUrl != null
        ? new StringValueObject(input.imageUrl, {
            maxLength: 1024,
            allowEmpty: false,
          })
        : null;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
  }
}

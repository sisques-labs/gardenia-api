import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Cover image URL passed through to the new tracked `Plant`. Capped at 500,
 * matching `plants`' own `PlantImageUrlValueObject` exactly — accepting
 * anything longer here would pass this context's own validation only to
 * throw deep inside `plants` once `IPlantsPort.createPlant()` dispatches
 * `CreatePlantCommand`.
 */
export class PlantIdentificationImageUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 500;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationImageUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

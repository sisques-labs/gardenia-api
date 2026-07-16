import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Which external catalog `resolvedSpeciesKey` belongs to (e.g. `"gbif"`).
 * Plain data, not a closed enum — `plant-species` (the only thing this
 * context talks to for species resolution today) happens to be GBIF-backed,
 * but this context must not hardcode that assumption; the adapter that
 * knows it's calling GBIF is the one place allowed to set this value.
 */
export class PlantIdentificationSpeciesProviderValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 50;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationSpeciesProviderValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Name given to the new tracked `Plant` when converting an identification.
 * Length mirrors `plants`' own `PlantNameValueObject` (100) — kept as a
 * plain literal rather than an import, since cross-context imports are only
 * allowed from `infrastructure/adapters/`. `plants`' own `CreatePlantCommand`
 * re-validates the name regardless.
 */
export class PlantIdentificationNameValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 100;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationNameValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

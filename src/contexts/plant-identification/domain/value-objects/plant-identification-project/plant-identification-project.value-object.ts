import { StringValueObject } from '@sisques-labs/nestjs-kit';

/** PlantNet dataset/project slug (e.g. `"all"`, `"useful"`, `"weeds"`). */
export class PlantIdentificationProjectValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 50;

  constructor(value: string) {
    super(value, {
      maxLength: PlantIdentificationProjectValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

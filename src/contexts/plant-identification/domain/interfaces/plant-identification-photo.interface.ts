import {
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';

/**
 * One submitted photo, as embedded in `PlantIdentificationAggregate`. Fixed
 * at creation time — no independent add/remove after the identification is
 * persisted.
 */
export interface IPlantIdentificationPhoto {
  fileId: UuidValueObject;
  /** Denormalized copy of the `files` context's resolved URL at upload time. */
  url: StringValueObject;
  organ: PlantIdentificationOrganValueObject;
  /** Preserves submitted order for display. */
  position: NumberValueObject;
}

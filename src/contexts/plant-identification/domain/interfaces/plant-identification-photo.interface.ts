import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationPhotoPositionValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-photo-position/plant-identification-photo-position.value-object';
import { PlantIdentificationPhotoUrlValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-photo-url/plant-identification-photo-url.value-object';

/**
 * One submitted photo, as embedded in `PlantIdentificationAggregate`. Fixed
 * at creation time — no independent add/remove after the identification is
 * persisted.
 */
export interface IPlantIdentificationPhoto {
  fileId: UuidValueObject;
  url: PlantIdentificationPhotoUrlValueObject;
  organ: PlantIdentificationOrganValueObject;
  position: PlantIdentificationPhotoPositionValueObject;
}

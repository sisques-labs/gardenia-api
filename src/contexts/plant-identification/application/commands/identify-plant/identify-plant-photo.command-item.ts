import { NumberValueObject, StringValueObject } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';

/**
 * One photo submitted to `IdentifyPlantCommand`, after wrapping in value
 * objects. `content` is intentionally NOT a value object — same reasoning as
 * `UploadPlantPhotoCommand.content`: transient transport→port payload, never
 * an aggregate field.
 */
export interface IdentifyPlantPhotoCommandItem {
  filename: StringValueObject;
  mimeType: StringValueObject;
  size: NumberValueObject;
  content: Buffer;
  organ: PlantIdentificationOrganValueObject;
}

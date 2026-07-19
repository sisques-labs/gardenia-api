import {
  FilenameValueObject,
  MimeTypeValueObject,
  NumberValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IdentifyPlantPhotoCommandItem } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-photo.command-item';
import { PlantIdentificationImageMimeTypeEnum } from '@contexts/plant-identification/domain/enums/plant-identification-image-mime-type.enum';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationUnsupportedImageFormatException } from '@contexts/plant-identification/domain/exceptions/plant-identification-unsupported-image-format.exception';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationProjectValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-project/plant-identification-project.value-object';

/**
 * PlantNet's identify endpoint only accepts image/jpeg or image/png (a real
 * HTTP 400 in production surfaced this for an image/webp upload — `files`
 * allows webp generally, PlantNet does not). Rejected here, at command
 * construction, so every transport gets the same guard for free instead of
 * a request reaching PlantNet just to bounce.
 */
const SUPPORTED_IMAGE_MIME_TYPES: string[] = Object.values(
  PlantIdentificationImageMimeTypeEnum,
);

export interface IdentifyPlantPhotoInput {
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer;
  organ: PlantIdentificationOrganEnum;
}

export interface IdentifyPlantCommandInput {
  photos: IdentifyPlantPhotoInput[];
  project?: string;
  userId: string;
  spaceId: string;
}

export class IdentifyPlantCommand {
  public readonly photos: IdentifyPlantPhotoCommandItem[];
  public readonly project: PlantIdentificationProjectValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: IdentifyPlantCommandInput) {
    this.photos = input.photos.map((photo) => {
      const mimeType = new MimeTypeValueObject(photo.mimeType);
      if (!SUPPORTED_IMAGE_MIME_TYPES.includes(mimeType.value)) {
        throw new PlantIdentificationUnsupportedImageFormatException(
          mimeType.value,
        );
      }
      return {
        filename: new FilenameValueObject(photo.filename),
        mimeType,
        size: new NumberValueObject(photo.size),
        content: photo.content,
        organ: new PlantIdentificationOrganValueObject(photo.organ),
      };
    });
    this.project =
      input.project != null && input.project !== ''
        ? new PlantIdentificationProjectValueObject(input.project)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

import {
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IdentifyPlantPhotoCommandItem } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-photo.command-item';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';

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
  public readonly project: StringValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: IdentifyPlantCommandInput) {
    this.photos = input.photos.map((photo) => ({
      filename: new StringValueObject(photo.filename),
      mimeType: new StringValueObject(photo.mimeType),
      size: new NumberValueObject(photo.size),
      content: photo.content,
      organ: new PlantIdentificationOrganValueObject(photo.organ),
    }));
    this.project =
      input.project != null && input.project !== ''
        ? new StringValueObject(input.project)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

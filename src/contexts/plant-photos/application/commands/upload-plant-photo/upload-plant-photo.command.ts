import {
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';

export type UploadPlantPhotoCommandInput = Pick<
  IPlantPhotoPrimitives,
  'plantId' | 'userId' | 'spaceId'
> & {
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer;
};

export class UploadPlantPhotoCommand {
  public readonly plantId: UuidValueObject;
  public readonly filename: StringValueObject;
  public readonly mimeType: StringValueObject;
  public readonly size: NumberValueObject;
  /**
   * Raw bytes handed to the storage port. Intentionally NOT a value object:
   * the buffer is transient transport→port payload, never an aggregate
   * field — same reasoning as `content` on `UploadFileCommand`.
   */
  public readonly content: Buffer;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: UploadPlantPhotoCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.filename = new StringValueObject(input.filename);
    this.mimeType = new StringValueObject(input.mimeType);
    this.size = new NumberValueObject(input.size);
    this.content = input.content;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

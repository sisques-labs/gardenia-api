import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type UploadPlantPhotoCommandInput = {
  plantId: string;
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer;
  userId: string;
  spaceId: string;
};

export class UploadPlantPhotoCommand {
  public readonly plantId: UuidValueObject;
  /**
   * Transient pass-through payload for `IFilesPort.uploadFile()` — not a
   * `plant-photos` domain concept (this aggregate never stores filename,
   * mime type, or size). Validated inside the `files` context, same
   * reasoning as `content` on `UploadFileCommand`.
   */
  public readonly filename: string;
  public readonly mimeType: string;
  public readonly size: number;
  public readonly content: Buffer;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: UploadPlantPhotoCommandInput) {
    this.plantId = new UuidValueObject(input.plantId);
    this.filename = input.filename;
    this.mimeType = input.mimeType;
    this.size = input.size;
    this.content = input.content;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

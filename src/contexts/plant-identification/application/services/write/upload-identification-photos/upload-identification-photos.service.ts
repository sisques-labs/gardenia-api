import { Inject, Injectable } from '@nestjs/common';
import {
  FilenameValueObject,
  IBaseService,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IdentifyPlantPhotoCommandItem } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-photo.command-item';
import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-identification/application/ports/files.port';
import { UploadedFilePortResult } from '@contexts/plant-identification/application/ports/uploaded-file-port.result';

export interface UploadIdentificationPhotosServiceInput {
  photos: IdentifyPlantPhotoCommandItem[];
  userId: UuidValueObject;
  spaceId: UuidValueObject;
}

/** Uploads every submitted photo via `files`, one call per photo, concurrently. */
@Injectable()
export class UploadIdentificationPhotosService implements IBaseService<
  UploadIdentificationPhotosServiceInput,
  UploadedFilePortResult[]
> {
  constructor(
    @Inject(FILES_PORT)
    private readonly filesPort: IFilesPort,
  ) {}

  async execute(
    input: UploadIdentificationPhotosServiceInput,
  ): Promise<UploadedFilePortResult[]> {
    return Promise.all(
      input.photos.map((photo) =>
        this.filesPort.uploadFile({
          filename: new FilenameValueObject(photo.filename.value),
          mimeType: photo.mimeType,
          size: photo.size,
          content: photo.content,
          userId: input.userId,
          spaceId: input.spaceId,
        }),
      ),
    );
  }
}

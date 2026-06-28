import {
  BadRequestException,
  Inject,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { FileTooLargeException } from '@contexts/files/domain/exceptions/file-too-large.exception';
import { UnsupportedFileTypeException } from '@contexts/files/domain/exceptions/unsupported-file-type.exception';
import {
  FilesConfig,
  filesConfig,
} from '@contexts/files/infrastructure/config/files.config';
import { UploadedImageFile } from './uploaded-image-file.interface';

/**
 * Validates an uploaded file against the configured MIME allowlist and maximum
 * size. Enforced at the transport boundary, in addition to the domain value
 * objects, so an invalid upload is rejected before any work is done.
 */
@Injectable()
export class ImageFileValidationPipe implements PipeTransform<
  UploadedImageFile | undefined,
  UploadedImageFile
> {
  constructor(
    @Inject(filesConfig.KEY)
    private readonly config: FilesConfig,
  ) {}

  transform(file: UploadedImageFile | undefined): UploadedImageFile {
    if (!file) {
      throw new BadRequestException(
        'A file part named "file" is required (multipart/form-data)',
      );
    }

    if (!this.config.allowedMimeTypes.includes(file.mimetype)) {
      throw new UnsupportedFileTypeException(
        file.mimetype,
        this.config.allowedMimeTypes,
      );
    }

    if (file.size > this.config.maxSizeBytes) {
      throw new FileTooLargeException(file.size, this.config.maxSizeBytes);
    }

    return file;
  }
}

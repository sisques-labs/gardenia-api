import { BadRequestException } from '@nestjs/common';

import { FileTooLargeException } from '@contexts/files/domain/exceptions/file-too-large.exception';
import { UnsupportedFileTypeException } from '@contexts/files/domain/exceptions/unsupported-file-type.exception';
import { FilesConfig } from '@contexts/files/infrastructure/config/files.config';
import { ImageFileValidationPipe } from './image-file-validation.pipe';
import { UploadedImageFile } from './uploaded-image-file.interface';

const buildFile = (
  overrides: Partial<UploadedImageFile> = {},
): UploadedImageFile => ({
  fieldname: 'file',
  originalname: 'rose.png',
  encoding: '7bit',
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from('data'),
  ...overrides,
});

describe('ImageFileValidationPipe', () => {
  let pipe: ImageFileValidationPipe;
  const config: FilesConfig = {
    maxSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    publicBaseUrl: '',
  };

  beforeEach(() => {
    pipe = new ImageFileValidationPipe(config);
  });

  it('should throw BadRequestException when no file is provided', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });

  it('should throw UnsupportedFileTypeException when mime type is not allowed', () => {
    const file = buildFile({ mimetype: 'application/pdf' });

    expect(() => pipe.transform(file)).toThrow(UnsupportedFileTypeException);
  });

  it('should throw FileTooLargeException when file exceeds max size', () => {
    const file = buildFile({ size: config.maxSizeBytes + 1 });

    expect(() => pipe.transform(file)).toThrow(FileTooLargeException);
  });

  it('should return the file unchanged when valid', () => {
    const file = buildFile();

    expect(pipe.transform(file)).toBe(file);
  });
});

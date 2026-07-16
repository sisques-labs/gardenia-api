import {
  FilenameValueObject,
  MimeTypeValueObject,
  NumberValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export interface UploadFilePortInput {
  filename: FilenameValueObject;
  mimeType: MimeTypeValueObject;
  size: NumberValueObject;
  content: Buffer;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
}

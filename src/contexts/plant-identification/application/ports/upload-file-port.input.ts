import {
  FilenameValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export interface UploadFilePortInput {
  filename: FilenameValueObject;
  mimeType: StringValueObject;
  size: NumberValueObject;
  content: Buffer;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
}

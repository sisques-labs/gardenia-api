import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';

export type UploadFileCommandInput = {
  filename: string;
  mimeType: string;
  size: number;
  content: Buffer;
  userId: string;
  spaceId: string;
};

export class UploadFileCommand {
  public readonly filename: FileNameValueObject;
  public readonly mimeType: FileMimeTypeValueObject;
  public readonly size: FileSizeValueObject;
  /**
   * Raw bytes handed to the storage port. Intentionally NOT a value object:
   * the buffer is transient transport→port payload, never an aggregate field.
   */
  public readonly content: Buffer;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: UploadFileCommandInput) {
    this.filename = new FileNameValueObject(input.filename);
    this.mimeType = new FileMimeTypeValueObject(
      input.mimeType as FileMimeTypeEnum,
    );
    this.size = new FileSizeValueObject(input.size);
    this.content = input.content;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}

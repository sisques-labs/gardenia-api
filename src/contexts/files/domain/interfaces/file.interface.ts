import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { FileIdValueObject } from '@contexts/files/domain/value-objects/file-id/file-id.value-object';
import { FileMimeTypeValueObject } from '@contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object';
import { FileNameValueObject } from '@contexts/files/domain/value-objects/file-name/file-name.value-object';
import { FileSizeValueObject } from '@contexts/files/domain/value-objects/file-size/file-size.value-object';
import { FileStorageKeyValueObject } from '@contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object';
import { FileUrlValueObject } from '@contexts/files/domain/value-objects/file-url/file-url.value-object';

export interface IFile {
  id: FileIdValueObject;
  filename: FileNameValueObject;
  mimeType: FileMimeTypeValueObject;
  size: FileSizeValueObject;
  storageKey: FileStorageKeyValueObject;
  url: FileUrlValueObject;
  userId: UuidValueObject;
  spaceId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}

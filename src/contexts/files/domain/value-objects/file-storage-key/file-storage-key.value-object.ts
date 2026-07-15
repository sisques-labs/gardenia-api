import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Opaque locator the storage backend uses to address the file's bytes. For the
 * database adapter it is the file id; for an object-storage adapter it could be
 * a bucket key. The domain treats it as an opaque string.
 */
export class FileStorageKeyValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 512;

  constructor(value: string) {
    super(value, {
      maxLength: FileStorageKeyValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

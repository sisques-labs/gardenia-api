import { StringValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Public-facing locator resolved by the storage adapter. For the database
 * adapter it points to the download endpoint; an object-storage adapter could
 * resolve it to a public or signed object URL. Opaque to the domain.
 */
export class FileUrlValueObject extends StringValueObject {
  static readonly MAX_LENGTH = 1024;

  constructor(value: string) {
    super(value, {
      maxLength: FileUrlValueObject.MAX_LENGTH,
      allowEmpty: false,
    });
  }
}

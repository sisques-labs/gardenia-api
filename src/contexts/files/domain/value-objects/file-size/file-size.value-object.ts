import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/**
 * File size in bytes. Must be strictly positive. The configurable upper bound
 * (FILES_MAX_SIZE_BYTES) is enforced at the transport boundary and the upload
 * handler, where the limit is available — not here, since the domain has no
 * access to config.
 */
export class FileSizeValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1 });
  }
}

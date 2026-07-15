import { BaseException } from '@sisques-labs/nestjs-kit';

export class UnsupportedFileTypeException extends BaseException {
  constructor(mimeType: string, allowed: readonly string[]) {
    super(
      `Unsupported file type '${mimeType}'. Allowed types: ${allowed.join(', ')}`,
    );
  }
}

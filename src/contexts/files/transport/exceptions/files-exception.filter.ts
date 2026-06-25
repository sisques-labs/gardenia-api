import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

export function resolveFilesExceptionStatus(
  exception: BaseException,
): HttpStatus | null {
  if (exception instanceof FileNotFoundException) {
    return HttpStatus.NOT_FOUND;
  }
  return null;
}

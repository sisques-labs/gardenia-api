import { HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { FileNotFoundException } from '@contexts/files/domain/exceptions/file-not-found.exception';
import { resolveFilesExceptionStatus } from './files-exception.filter';

describe('resolveFilesExceptionStatus', () => {
  it('should return NOT_FOUND for FileNotFoundException', () => {
    const exception = new FileNotFoundException('550e8400');

    expect(resolveFilesExceptionStatus(exception)).toBe(HttpStatus.NOT_FOUND);
  });

  it('should return null for an unrelated exception', () => {
    class OtherException extends BaseException {
      constructor() {
        super('other');
      }
    }

    expect(resolveFilesExceptionStatus(new OtherException())).toBeNull();
  });
});

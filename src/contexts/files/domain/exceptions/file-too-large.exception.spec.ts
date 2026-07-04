import { BaseException } from '@sisques-labs/nestjs-kit';

import { FileTooLargeException } from './file-too-large.exception';

describe('FileTooLargeException', () => {
  it('should be an instance of BaseException', () => {
    const exception = new FileTooLargeException(2000, 1000);

    expect(exception).toBeInstanceOf(BaseException);
  });

  it('should build a message including both the size and the max size', () => {
    const exception = new FileTooLargeException(2048, 1024);

    expect(exception.message).toBe(
      'File size 2048 bytes exceeds the maximum allowed size of 1024 bytes',
    );
  });
});

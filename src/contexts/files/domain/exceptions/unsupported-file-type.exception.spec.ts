import { BaseException } from '@sisques-labs/nestjs-kit';

import { UnsupportedFileTypeException } from './unsupported-file-type.exception';

describe('UnsupportedFileTypeException', () => {
  it('should be an instance of BaseException', () => {
    const exception = new UnsupportedFileTypeException('image/gif', [
      'image/png',
    ]);

    expect(exception).toBeInstanceOf(BaseException);
  });

  it('should build a message including the mime type and allowed list', () => {
    const exception = new UnsupportedFileTypeException('image/gif', [
      'image/png',
      'image/jpeg',
    ]);

    expect(exception.message).toBe(
      "Unsupported file type 'image/gif'. Allowed types: image/png, image/jpeg",
    );
  });

  it('should render an empty allowed list gracefully', () => {
    const exception = new UnsupportedFileTypeException('image/gif', []);

    expect(exception.message).toBe(
      "Unsupported file type 'image/gif'. Allowed types: ",
    );
  });
});

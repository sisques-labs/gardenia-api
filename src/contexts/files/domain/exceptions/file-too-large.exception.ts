import { BaseException } from '@sisques-labs/nestjs-kit';

export class FileTooLargeException extends BaseException {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${size} bytes exceeds the maximum allowed size of ${maxSize} bytes`,
    );
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class BioExceedsMaxLengthException extends BaseException {
  static readonly MAX_LENGTH = 500;

  constructor(length: number) {
    super(
      `Bio exceeds the maximum allowed length of ${BioExceedsMaxLengthException.MAX_LENGTH} characters (received ${length}).`,
    );
  }
}

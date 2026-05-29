import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceContextMissingException extends BaseException {
  constructor() {
    super(
      'SpaceContext is not set. A request-scoped spaceId must be established before executing repository operations',
    );
  }
}

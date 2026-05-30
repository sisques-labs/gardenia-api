import { BaseException } from '@sisques-labs/nestjs-kit';

export class NotSpaceOwnerException extends BaseException {
  constructor(userId: string, spaceId: string) {
    super(`User '${userId}' is not the owner of space '${spaceId}'`);
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class NotASpaceMemberException extends BaseException {
  constructor(userId: string, spaceId: string) {
    super(`User '${userId}' is not a member of space '${spaceId}'`);
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class DuplicateMembershipException extends BaseException {
  constructor(userId: string, spaceId: string) {
    super(`User '${userId}' is already a member of space '${spaceId}'`);
  }
}

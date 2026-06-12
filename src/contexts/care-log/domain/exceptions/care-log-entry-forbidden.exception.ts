import { BaseException } from '@sisques-labs/nestjs-kit';

export class CareLogEntryForbiddenException extends BaseException {
  constructor(userId: string, entryId: string) {
    super(`User '${userId}' is not the author of care log entry '${entryId}'`);
  }
}

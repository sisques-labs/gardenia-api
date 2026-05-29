import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceLimitExceededException extends BaseException {
  constructor(userId: string, limit: number) {
    super(
      `User '${userId}' has reached the maximum limit of ${limit} owned spaces`,
    );
  }
}

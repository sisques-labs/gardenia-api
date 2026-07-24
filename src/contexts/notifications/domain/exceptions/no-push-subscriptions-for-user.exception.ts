import { BaseException } from '@sisques-labs/nestjs-kit';

export class NoPushSubscriptionsForUserException extends BaseException {
  constructor(userId: string) {
    super(`User '${userId}' has no registered push subscriptions`);
  }
}

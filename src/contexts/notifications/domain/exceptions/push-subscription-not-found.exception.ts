import { BaseException } from '@sisques-labs/nestjs-kit';

export class PushSubscriptionNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Push subscription with id '${id}' was not found`);
  }
}

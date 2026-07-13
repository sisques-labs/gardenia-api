import { BaseException } from '@sisques-labs/nestjs-kit';

export class NotificationNotOwnedException extends BaseException {
  constructor(id: string) {
    super(`Notification with id '${id}' does not belong to the current user`);
  }
}

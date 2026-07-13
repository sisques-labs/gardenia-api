import { BaseException } from '@sisques-labs/nestjs-kit';

export class NotificationDedupeKeyMismatchException extends BaseException {
  constructor(dedupeKey: string, expected: string) {
    super(
      `Notification dedupeKey '${dedupeKey}' does not match the expected '${expected}' derived from type and referenceId`,
    );
  }
}

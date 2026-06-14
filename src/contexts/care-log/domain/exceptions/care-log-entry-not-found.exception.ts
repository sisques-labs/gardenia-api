import { BaseException } from '@sisques-labs/nestjs-kit';

export class CareLogEntryNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Care log entry with id '${id}' was not found`);
  }
}

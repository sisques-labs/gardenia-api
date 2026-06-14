import { BaseException } from '@sisques-labs/nestjs-kit';

export class CareLogPerformedAtInvalidException extends BaseException {
  constructor() {
    super('performedAt cannot be in the future');
  }
}

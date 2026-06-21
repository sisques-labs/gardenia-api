import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidApiTokenLabelException extends BaseException {
  constructor() {
    super('Invalid API token label: must be between 1 and 100 characters');
  }
}

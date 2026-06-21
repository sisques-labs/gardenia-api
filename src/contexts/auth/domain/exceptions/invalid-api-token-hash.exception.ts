import { BaseException } from '@sisques-labs/nestjs-kit';

export class InvalidApiTokenHashException extends BaseException {
  constructor() {
    super('Invalid API token hash: expected a 64-char hex SHA-256 digest');
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class ApiTokenNotFoundException extends BaseException {
  constructor(id: string) {
    super(`API token ${id} was not found`);
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class FileNotFoundException extends BaseException {
  constructor(id: string) {
    super(`File with id '${id}' was not found`);
  }
}

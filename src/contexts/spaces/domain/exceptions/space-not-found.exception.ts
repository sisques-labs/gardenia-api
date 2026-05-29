import { BaseException } from '@sisques-labs/nestjs-kit';

export class SpaceNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Space with id '${id}' was not found`);
  }
}

import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Plant with id '${id}' was not found`);
  }
}

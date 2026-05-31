import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Plant species with id '${id}' was not found`);
  }
}

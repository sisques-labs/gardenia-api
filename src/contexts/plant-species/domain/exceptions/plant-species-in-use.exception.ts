import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesInUseException extends BaseException {
  constructor(id: string) {
    super(`Plant species with id '${id}' is referenced by one or more plants`);
  }
}

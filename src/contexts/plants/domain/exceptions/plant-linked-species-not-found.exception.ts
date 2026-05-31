import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantLinkedSpeciesNotFoundException extends BaseException {
  constructor(plantSpeciesId: string) {
    super(`Plant species with id '${plantSpeciesId}' was not found`);
  }
}

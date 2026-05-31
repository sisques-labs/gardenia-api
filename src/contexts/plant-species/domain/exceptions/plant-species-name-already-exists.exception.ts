import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesNameAlreadyExistsException extends BaseException {
  constructor(name: string) {
    super(`Plant species with name '${name}' already exists`);
  }
}

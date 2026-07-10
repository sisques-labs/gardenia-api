import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantSpeciesGbifKeyAlreadyExistsException extends BaseException {
  constructor(gbifKey: number) {
    super(`Plant species with gbifKey '${gbifKey}' already exists`);
  }
}

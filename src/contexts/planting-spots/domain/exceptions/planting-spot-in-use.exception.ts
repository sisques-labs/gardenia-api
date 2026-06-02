import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotInUseException extends BaseException {
  constructor(id: string) {
    super(`Planting spot with id '${id}' is referenced by one or more plants`);
  }
}

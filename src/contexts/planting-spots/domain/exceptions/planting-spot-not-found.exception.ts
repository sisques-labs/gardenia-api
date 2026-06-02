import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantingSpotNotFoundException extends BaseException {
  constructor(id: string) {
    super(`Planting spot with id '${id}' was not found`);
  }
}

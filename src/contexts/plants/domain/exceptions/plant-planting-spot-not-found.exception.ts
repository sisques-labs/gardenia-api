import { BaseException } from '@sisques-labs/nestjs-kit';

export class PlantPlantingSpotNotFoundException extends BaseException {
  constructor(plantingSpotId: string) {
    super(`Planting spot with id '${plantingSpotId}' was not found`);
  }
}
